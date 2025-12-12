# Dukaan-Server Backend Documentation

This document is the complete backend specification for _Dukaan-Server_.
It is written for implementers and for Cursor to ingest as a backend skill.

Contents

1. Overview
2. System architecture
3. Technology choices
4. Authentication & OTP (Nodemailer + Redis)
5. Data models (MongoDB / Mongoose style)
6. API design (versioned /api/v1) with full endpoint list, request/response shapes, pagination & filters
7. Socket.IO real-time design (Redis adapter, rooms, events)
8. Caching strategy (Redis)
9. Rate limiting (configurable variables)
10. Background jobs & cron tasks
11. Security & deployment considerations
12. Admin workflows
13. Error handling & logging
14. Database indexes & concurrency control
15. Postman collection structure (JSON outline)
16. Environment variables (.env.example)
17. Onboarding notes for Cursor

---

## 1. Overview

Dukaan-Server is the backend for a hyperlocal micro-merchant delivery system focused on Mirpur, Azad Kashmir. It provides APIs for customers, merchants (shopkeepers), riders, and an admin operator. It supports:

- Real-time events via Socket.IO (with Redis adapter)
- Background push notifications via FCM (for when apps are backgrounded)
- Email OTP for customers and merchants via Nodemailer (with Redis for OTP storage/TTL)
- Cloudinary for media (product images, POD images)
- Redis for caching, sockets, OTP and ephemeral data
- MongoDB for primary data storage

High-level goals:

- Fast, predictable order lifecycle
- Reliable COD ledger and reconciliation
- Low cost and open-source friendly

---

## 2. System architecture

Components

- HTTP API server (Express + TypeScript)
- WebSocket server (Socket.IO integrated on same process or separate namespace)
- MongoDB (primary data store)
- Redis (caching, socket adapter, OTP store, idempotency keys, rate limiter state)
- Cloudinary (media storage)
- Nodemailer (email delivery for OTP and transactional emails)
- FCM (push notifications for background delivery)
- Background worker(s) (bullmq or node-cron jobs; uses Redis)

Deployment notes

- Initially deploy as a single Node.js service (API + Socket.IO) for simplicity.
- Use separate worker process for heavy background jobs (settlements, retries).
- Use Docker compose in development (services: node, mongodb, redis, cloudinary config local, minio not used since Cloudinary chosen).

---

## 3. Technology choices (summary)

- Node.js + TypeScript
- Express for HTTP
- Socket.IO for real-time events
- Mongoose ODM for MongoDB
- Redis for caching, adapter, OTP, idempotency keys
- Cloudinary SDK for uploads
- Nodemailer for email (SMTP)
- FCM server SDK for push
- BullMQ (or Bee-Queue) for background jobs (uses Redis)

---

## 4. Authentication & OTP

Overview

- Customers and Merchants authenticate by Email + OTP.
- Riders authenticate using credentials provided by the merchant (merchant creates rider and a password credential is returned or the rider is expected to set a password via a secure link).

OTP flow

1. Client calls `POST /api/v1/auth/send-otp` with `{ email, purpose }` where `purpose` is `login` or `register`.
2. Backend generates a 6-digit numeric OTP and a server-side `otpId` and stores hashed OTP in Redis with TTL (default 300s).
   - Also store metadata: purpose, email, requestId, attempts.
3. Nodemailer sends email with OTP (plain numeric code or link containing the `otpId`).
4. Client calls `POST /api/v1/auth/verify-otp` with `{ otpId, code }`.
5. Backend verifies hashed OTP from Redis and, if valid, creates/returns a JWT access token and a refresh token (stored hashed in DB / Redis) and user document if new.

Security considerations

- OTPs are hashed (bcrypt or HMAC) before storing in Redis.
- Limit OTP requests per email/IP (default: 5 per hour) stored in Redis counters.
- Limit OTP verify attempts (max 5 tries); after that mark `locked` for configurable cooldown.
- Use `requestId` or `clientRequestId` to avoid replay attacks.

Rider credentials

- Merchant creates rider via `POST /api/v1/merchants/:mid/riders`.
- Backend generates a secure temporary password or a password-reset link (valid 24 hours) and returns details to the merchant.
- Riders authenticate with email/password or can use OTP if the system later enables it.

Token management

- Access token short-lived (default TTL 15 minutes); refresh token long-lived (default TTL 30 days).
- Store refresh tokens hashed in DB (`users.refreshTokens[]`) and maintain a revocation list.

Redis usage for OTP

- Key pattern: `otp:{otpId}` -> { hashedCode, email, purpose, expiresAt, attempts }
- TTL equals OTP expiration.

---

## 5. Data models (MongoDB)

Note: use Mongoose with TypeScript interfaces. Provide timestamps: true and strict schemas.

Schemas (key fields) below are representative; include full validation in DTOs.

### users

```
User {
  _id: ObjectId,
  role: 'customer' | 'merchant_owner' | 'rider' | 'admin',
  email: string,
  phone?: string,
  name?: string,
  passwordHash?: string, // for riders or if merchant sets password
  profileCompleted: boolean,
  locale?: string, // for multi-language preference
  refreshTokens?: [ { tokenHash, createdAt, expiresAt } ],
  createdAt, updatedAt
}
```

Indexes: email unique

### merchants

```
Merchant {
  _id,
  ownerUserId: ObjectId,
  names: { en: string, ur?: string },
  shopAddress: { text: { en, ur? }, street?: string },
  geo: { type: 'Point', coordinates: [lng, lat] },
  deliveryRadiusMeters: number,
  deliveryCharge: number,
  openingHours: [ { day: 'mon'|'tue'..., slots: [ { start:'09:00', end:'13:00' } ] } ],
  isApproved: boolean,
  verification: { adminId?, verifiedAt?, notes?, docUrls: [url] },
  riders: [ObjectId],
  settings: { autoAcceptOrders: boolean, maxDeliverySlotsPerDay: number },
  createdAt, updatedAt
}
```

Indexes: 2dsphere on geo, ownerUserId

### riders

```
Rider {
  _id,
  merchantId,
  userId,
  name,
  phone,
  vehicleType?,
  active: boolean,
  currentLocation?: { coordinates:[lng,lat], updatedAt },
  earnings: { today, week, total },
  createdAt, updatedAt
}
```

Indexes: merchantId, userId

### products

```
Product {
  _id,
  merchantId,
  sku?,
  names: { en: string, ur?: string },
  description: { en?: string, ur?: string },
  images: [ { url, publicId } ],
  price: number,
  stock: number,
  unit?: string,
  category?: string,
  tags?: [string],
  active: boolean,
  createdAt, updatedAt
}
```

Indexes: merchantId, text index on names & description & tags

### orders

```
Order {
  _id,
  clientOrderId?: string, // for idempotency
  merchantId,
  customerId,
  customerSnapshot: { name, phone, addressText, geo: {lng,lat}, note },
  items: [ { productId, name, price, qty, unit, subtotal } ],
  subtotal,
  deliveryCharge,
  discount?,
  tax?,
  total,
  payment: { method: 'COD'|'DROP_AT_DOOR'|'DOOR_WALLET', status: 'PENDING'|'PAID'|'FAILED', providerTxId? },
  status: 'PLACED'|'MERCHANT_ACCEPTED'|'MERCHANT_REJECTED'|'AWAITING_CUSTOMER_CONFIRM'|'ASSIGNED'|'PICKED_UP'|'OUT_FOR_DELIVERY'|'DELIVERED'|'FAILED'|'CANCELLED',
  deliverySlot: { date, window },
  assignedRiderId?,
  pod: { imageUrl?, otp?, deliveredAt?, note? },
  logs: [ { actor: userId|null, type: string, message: string, at } ],
  dispute?: { openedBy, reason, status, adminNotes },
  createdAt, updatedAt
}
```

Indexes: merchantId, customerId, status, createdAt; compound index { merchantId:1, status:1, createdAt:-1 }

### cod_ledgers

```
CODLedger {
  _id,
  merchantId,
  orderId,
  amount,
  collectedByRiderId?,
  collectedAt?,
  status: 'PENDING'|'COLLECTED'|'SETTLED'|'DISPUTED',
  proofImageUrl?,
  createdAt, updatedAt
}
```

### notifications (in-app logs)

```
Notification {
  _id,
  toUserId,
  channel: 'socket'|'fcm'|'email'|'sms',
  type: string,
  payload: {},
  status: 'queued'|'sent'|'failed',
  createdAt, sentAt?
}
```

---

## 6. API design (versioned: /api/v1)

All endpoints require `Accept: application/json` and respond with the envelope `{ success, message, data }`.

Common headers

- `Authorization: Bearer <accessToken>`
- `X-Client-Request-Id: <uuid>` (optional, for idempotency)

Pagination standard

- Query params: `?page=1&limit=20` (defaults: page=1, limit=20; max limit configurable)
- Cursor-based pagination can be added later; start with page/limit.

Filtering standard

- Use query params: e.g., `/api/v1/merchants?lat=...&lng=...&radius=5000&open=true&query=milk`

### Auth

#### POST /api/v1/auth/send-otp

Request

```
{ email: string, purpose: 'login'|'register' }
```

Response 200

```
{ success:true, message:'OTP queued', data: { otpId } }
```

#### POST /api/v1/auth/verify-otp

Request

```
{ otpId: string, code: string }
```

Response 200

```
{ success:true, data: { accessToken, refreshToken, user } }
```

#### POST /api/v1/auth/refresh

Request

```
{ refreshToken }
```

### Merchant registration & profile

#### POST /api/v1/merchants

- Body: merchant registration with multilingual fields
- Default status: pending
- Response: merchant doc

Example body

```
{
  ownerUserId: "...",
  names: { en: "Ali Store", ur: "علی دکان" },
  shopAddress: { text: { en: "House 12, Street X", ur: "..." } },
  geo: { lat: 33.148, lng: 73.751 },
  deliveryRadiusMeters: 3000,
  deliveryCharge: 60,
  openingHours: [ { day: "mon", slots:[{start:"09:00", end:"21:00"}] } ]
}
```

#### GET /api/v1/merchants/:id

#### GET /api/v1/merchants (discovery)

Query params: `lat,lng,radius,open,query,page,limit,category`

- Uses geoNear query with `maxDistance` in meters
- If `open=true`, filter by opening hours for current local day & time
- Response meta: `total, page, limit`

#### PATCH /api/v1/merchants/:id

- Merchant updates fields; if geo or deliveryRadius changed, recalc visibility

#### POST /api/v1/merchants/:id/verify (admin only)

- Body: `{ approved: boolean, notes?: string }`
- If approved: `isApproved=true` and send notification to owner

### Products

#### POST /api/v1/merchants/:mid/products

- Body includes multilingual names & description, price, stock, images (Cloudinary publicId/url)
- Validate merchant owns token

#### GET /api/v1/merchants/:mid/products

- Query params: `page, limit, q, category, minPrice, maxPrice, inStock` (text search across names/desc)

#### PATCH /api/v1/products/:id

#### DELETE /api/v1/products/:id

### Riders

#### POST /api/v1/merchants/:mid/riders

- Merchant creates rider; backend creates `User` with role `rider` and returns credentials or reset link

#### GET /api/v1/merchants/:mid/riders

- Pagination and filter by `active`

### Orders

All order creating endpoints must be idempotent. Clients MUST send `X-Client-Request-Id` for order creation.

#### POST /api/v1/merchants/:mid/orders

Request body

```
{
  clientOrderId?: string,
  customerId,
  customerSnapshot: { name, phone, addressText, geo:{lat,lng}, note },
  items: [ { productId, qty } ],
  paymentMethod: 'COD'|'DROP_AT_DOOR'|'DOOR_WALLET',
  deliverySlot: { date: 'YYYY-MM-DD', window: '10:00-12:00' }
}
```

Server actions

- Validate stock with atomic update (see concurrency) and calculate subtotal/total
- Create order with status `PLACED` and emit socket event `order:new` to `shop:{merchantId}`
- Create COD ledger entry (if paymentMethod is COD or DROP_AT_DOOR)
- Return 201 with order doc

#### PUT /api/v1/orders/:id/merchant-accept

- Body: `{ accepted: boolean, unavailableItems?: [productId], notes?: string }`
- If unavailableItems provided: compute new total and set status `AWAITING_CUSTOMER_CONFIRM` and emit `order:confirm-required` to `customer:{customerId}`

#### PUT /api/v1/orders/:id/customer-confirm

- Customer confirms or cancels
- If confirms: set status `MERCHANT_ACCEPTED` and continue; if cancels: cancel order and revert stock

#### PUT /api/v1/orders/:id/assign-rider

- Merchant assigns `riderId`
- status -> `ASSIGNED` and emit `rider:assigned` to `rider:{riderId}`

#### PUT /api/v1/orders/:id/rider-update

- Body: `{ status: 'PICKED_UP'|'OUT_FOR_DELIVERY'|'DELIVERED'|'FAILED', podImageUrl?, otpProvided? }`
- On DELIVERED: set payment.status to PAID (if digital) or update COD ledger when rider marks collected
- Emit `order:status` updates to `customer` & `shop`

#### GET /api/v1/orders (merchant/customer/rider filtered)

- Pagination and filters: status, dateFrom, dateTo

### COD Ledger & Settlements

#### GET /api/v1/merchants/:mid/cod-ledger?status=&page=&limit=

- Returns ledger entries and totals

#### POST /api/v1/merchants/:mid/settlements

- Admin/merchant triggers settlement; generate settlement record and mark ledger entries as SETTLED

### Notifications

#### POST /api/v1/notifications/send (internal)

- Body: `{ toUserId, channels:[ 'socket','fcm','email' ], type, payload }`
- The notification module decides delivery channel based on user connection, FCM tokens, and user preferences

---

## 7. Socket.IO real-time design

Key design

- Socket.IO with Redis Adapter for horizontal scaling
- Authenticate sockets by `accessToken` query param or initial auth message
- On connection, server resolves user and joins rooms:
  - `customer:{customerId}`
  - `shop:{merchantId}` (shop owners and shop staff can join)
  - `rider:{riderId}`
- Maintain an in-memory or Redis-backed presence list: `presence:shop:{shopId}` -> number of connected sockets and socketIds

Redis adapter & socket persistence

- Use `socket.io-redis` adapter; configure `REDIS_URL`.
- Use Redis to store ephemeral socket->user mapping for cross-process message routing.

Room and event rules

- Emit from service layer, never from controllers directly.
- Use ack callbacks for critical events (order placed, rider assigned) and handle negative acks

Core socket events (server emits)

- `order:new` -> `shop:{shopId}` (payload: order summary)
- `order:confirm-required` -> `customer:{customerId}` (payload: updated items + new total)
- `order:accepted` -> `customer:{customerId}`
- `order:rejected` -> `customer:{customerId}`
- `rider:assigned` -> `rider:{riderId}`
- `order:status` -> `customer:{customerId}`, `shop:{shopId}`
- `delivery:nearby` -> `customer:{customerId}` (optional proximity alerts)

Client emits (examples)

- `order:create` -> server validates and replies with ack + orderId
- `rider:location:update` -> server stores latest location (throttled) and can emit `delivery:nearby` if within threshold

Fallback strategy

- When a socket delivery fails or the recipient is not connected, the Notification module should queue a push notification via FCM and store the notification record in DB.

---

## 8. Caching strategy (Redis)

Goals: improve discovery performance, reduce DB reads, keep cache consistency.

What to cache

- Merchant discovery results (shops near a coordinate) -> cache for short TTL (e.g., 30s)
- Product lists per merchant (first page + counts) -> TTL 60s
- Shop metadata (opening hours, delivery radius) -> TTL 5 minutes
- Frequently used config and lookup tables -> TTL 10m

Cache keys (recommendation)

- `merchants:near:{lat}:{lng}:{radius}:{page}:{qhash}`
- `merchant:products:{merchantId}:page:{n}`
- `merchant:meta:{merchantId}`
- `product:{id}`

Invalidation strategy

- On product update/create/delete: invalidate `merchant:products:{merchantId}:*` and `merchant:meta:{merchantId}`
- On merchant update: invalidate discovery caches that include the merchant (conservative approach: invalidate `merchants:near:*` or maintain a mapping)
- On order creation that significantly affects stock: invalidate product caches for that merchant

Cache-aside pattern

- Read from Redis; on miss, read from DB and populate Redis with TTL

Locking and atomicity

- For inventory-critical operations, use DB atomic updates. Do not rely solely on cache for stock consistency.

Use Redis for other purposes

- OTP store
- Idempotency keys for `clientRequestId`
- Socket presence and ephemeral maps

---

## 9. Rate limiting

Default logic included, variables are configurable via env. Implement a middleware that consults Redis counters.

Config variables (defaults)

```
RATE_LIMIT_ENABLED=false
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS_PER_WINDOW=30
```

Behavior

- For each request: key = `rate:{userId||ip}:{windowStart}` increment counter; if above threshold, return 429.
- Apply stronger limits for auth endpoints (OTP send) and order creation.

Note: initially set `RATE_LIMIT_ENABLED=false` and enable later. The logic is present and easy to flip on.

---

## 10. Background jobs & cron tasks

Implement via BullMQ or Bee-Queue. These require Redis.

Jobs

- Order TTL cancellation: if merchant does not accept within `ORDER_MERCHANT_TTL_MINUTES` cancel and notify customer.
- Daily settlement job: summarize COD pending and generate settlement drafts for merchant; run once per day.
- Failed-payment retry job: reattempt webhook calls or notify merchants of pending payments.
- Cleanup job: remove expired OTP entries, temp files, and old notifications after retention period.
- Notification retry job: retry failed notifications to FCM or email.

Job configuration examples

- `ORDER_MERCHANT_TTL_MINUTES=10`
- `SETTLEMENT_DAILY_AT=02:00` (server timezone configurable)

---

## 11. Security

- Use HTTPS in production.
- Validate all inputs via DTOs (zod/Joi/class-validator).
- Use helmet, payload size limits, rate limiting middleware.
- Sanitize/escape outputs when generating any HTML (emails).
- Hash refresh tokens and OTPs.
- RBAC middleware: ensure route-level permissions.
- Use CORS allow list.

Sensitive data

- Never store raw OTPs; store hashed.
- Store Cloudinary credentials and SMTP credentials in environment variables.

---

## 12. Admin workflows

Admin responsibilities

- Review merchant registrations and uploaded verification docs.
- Approve/reject merchant, with reason stored and notification to merchant.
- View orders, disputes, settlements, and trigger manual settlement corrections.

Endpoints

- `GET /api/v1/admin/merchants?status=pending&page&limit`
- `PATCH /api/v1/admin/merchants/:id/approve` body `{ approved: boolean, notes?: string }`
- `GET /api/v1/admin/orders?status=&from=&to=&page&limit`
- `POST /api/v1/admin/disputes/:id/resolve` body `{ resolution, adminNotes }`

Audit logs

- Admin actions (approve/reject) must write to `audit_logs` collection with adminId and timestamp.

---

## 13. Error handling & logging

Error format

```
{ success:false, message: 'Validation failed', code: 'INVALID_PAYLOAD', details?: {} }
```

Logging

- Use Winston (structured logs) with levels: error, warn, info, debug
- Include `traceId` for request-scoped logs (inject a unique request id on each HTTP request)
- Log critical state transitions: order creation, merchant approval, rider assignment, settlement

---

## 14. DB indexes & concurrency control

Indexes to create

- users: `{ email:1 }` unique
- merchants: `{ geo: '2dsphere' }` for geo queries
- products: `{ merchantId:1 }`, text index `{ 'names.en': 'text', 'description.en': 'text', 'tags':'text' }`
- orders: `{ merchantId:1, status:1, createdAt:-1 }`
- cod_ledgers: `{ merchantId:1, status:1 }`

Concurrency & stock

- Use atomic `findOneAndUpdate` with `$inc` and precondition `stock >= qty` for stock decrement
- Example: `findOneAndUpdate({ _id: productId, stock: { $gte: qty } }, { $inc: { stock: -qty } })` and check result
- For multi-product orders, use MongoDB transactions (session) to update multiple docs atomically if replica set is used

Idempotency

- For `POST /orders` enforce idempotency via `X-Client-Request-Id` stored in Redis as `idempotency:{clientRequestId}` with TTL

---

## 15. Postman collection (JSON outline)

Include a Postman collection JSON file in your repo. Outline of structure (minimal example):

```
{
  info: { name: "Dukaan-Server API", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  item: [
    { name: "Auth", item: [
        { name: "Send OTP", request: { method: "POST", header:[...], body:{ mode:"raw", raw: JSON.stringify({ email:"test@example.com", purpose:"login"}) }, url: "/api/v1/auth/send-otp" } },
        { name: "Verify OTP", request: {...} }
      ] },
    { name: "Merchants", item: [ { name: "Create Merchant", request: {...} }, { name: "Get Nearby Merchants", request: {...} } ] },
    { name: "Products", item: [...] },
    { name: "Orders", item: [...] }
  ]
}
```

Provide environment variables in Postman: `{{baseUrl}}`, `{{accessToken}}`, `{{merchantId}}`, `{{customerId}}`.

---

## 16. Environment variables (.env.example)

```
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/dukaan
REDIS_URL=redis://localhost:6379
JWT_SECRET=changeme
JWT_ACCESS_TTL_MIN=15
JWT_REFRESH_TTL_DAYS=30
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=secret
CLOUDINARY_CLOUD_NAME=yourcloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=yyy
FCM_SERVER_KEY=xxx
RATE_LIMIT_ENABLED=false
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS_PER_WINDOW=30
ORDER_MERCHANT_TTL_MINUTES=10
SETTLEMENT_DAILY_AT=02:00
CACHE_DEFAULT_TTL_SECONDS=60
MAPS_PROVIDER=LEAFLET_OR_GOOGLE // LEAFLET preferred; set to GOOGLE to use Google maps link
GOOGLE_MAPS_API_KEY=
```

---

## 17. Onboarding notes for Cursor

- Use the module folder pattern. Generate full modules, not snippets.
- Ensure DTOs for all endpoints. Use class-validator or zod for validation.
- Use Socket events defined in section 7 with strict typing.
- Implement Redis adapter for Socket.IO and OTP store in Redis.
- Implement Cloudinary upload helper with signed uploads from the backend.
- Provide Postman collection JSON as `postman_collection.json` in repo root.
- Write seed script to create sample admin, sample merchant (approved), sample products, rider and customer.

---
