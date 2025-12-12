# Dukaan-Server Backend

Backend for hyperlocal micro-merchant delivery system focused on Mirpur, Azad Kashmir.

## Features

- **Authentication**: Email-based OTP authentication for customers and merchants
- **Merchant Management**: Onboarding, approval workflow, profile management
- **Product Catalog**: SKU management, pricing, stock, images, categories
- **Order Management**: Complete order lifecycle with real-time updates
- **Rider Management**: Rider profiles under merchants
- **COD Ledger**: Cash-on-delivery tracking and reconciliation
- **Real-time Updates**: Socket.IO with Redis adapter
- **Notifications**: FCM push, in-app, email notifications
- **Background Jobs**: Order expiry, settlements, cleanup

## Tech Stack

- **Node.js** + **TypeScript**
- **Express** for HTTP API
- **Socket.IO** for real-time events
- **MongoDB** + **Mongoose** for data storage
- **Redis** for caching, sockets, OTP, idempotency
- **Cloudinary** for media storage
- **Nodemailer** for email delivery
- **FCM** for push notifications
- **BullMQ** for background jobs

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 6+

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
- MongoDB connection string
- Redis URL
- JWT secret
- SMTP credentials
- Cloudinary credentials
- FCM server key (optional)

5. Run the seed script to create sample data:
```bash
npm run seed
```

## Running the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## API Documentation

The API is versioned at `/api/v1`. All endpoints return:
```json
{
  "success": boolean,
  "message": string,
  "data": any
}
```

### Authentication

- `POST /api/v1/auth/send-otp` - Send OTP to email
- `POST /api/v1/auth/verify-otp` - Verify OTP and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Merchants

- `POST /api/v1/merchants` - Create merchant (requires auth)
- `GET /api/v1/merchants` - Get nearby merchants (geo-search)
- `GET /api/v1/merchants/:id` - Get merchant by ID
- `PATCH /api/v1/merchants/:id` - Update merchant (requires auth)
- `PATCH /api/v1/merchants/:id/verify` - Verify merchant (admin only)

### Products

- `POST /api/v1/merchants/:mid/products` - Create product (requires auth)
- `GET /api/v1/merchants/:mid/products` - Get products by merchant
- `GET /api/v1/products/:id` - Get product by ID
- `PATCH /api/v1/products/:id` - Update product (requires auth)
- `DELETE /api/v1/products/:id` - Delete product (requires auth)

### Orders

- `POST /api/v1/merchants/:mid/orders` - Create order (requires auth, idempotent)
- `GET /api/v1/orders/:id` - Get order by ID (requires auth)
- `PUT /api/v1/orders/:id/merchant-accept` - Merchant accept/reject (requires auth)
- `PUT /api/v1/orders/:id/customer-confirm` - Customer confirm (requires auth)
- `PUT /api/v1/orders/:id/assign-rider` - Assign rider (requires auth)
- `PUT /api/v1/orders/:id/rider-update` - Rider update status (requires auth)
- `GET /api/v1/orders` - Get customer orders (requires auth)
- `GET /api/v1/merchants/:mid/orders` - Get merchant orders (requires auth)

### Riders

- `POST /api/v1/merchants/:mid/riders` - Create rider (requires auth)
- `GET /api/v1/merchants/:mid/riders` - Get riders by merchant (requires auth)

### COD Ledger

- `GET /api/v1/merchants/:mid/cod-ledger` - Get COD ledger (requires auth)
- `POST /api/v1/merchants/:mid/settlements` - Create settlement (requires auth)

## Customer API

All customer endpoints require authentication with `customer` role.

### Customer Profile

- `GET /api/v1/customers/profile` - Get customer profile
- `PATCH /api/v1/customers/profile` - Update customer profile (name, phone, locale)

**Update Profile Request:**
```json
{
  "name": "John Doe",
  "phone": "+923001234567",
  "locale": "en"
}
```

### Addresses

- `POST /api/v1/addresses` - Create address with geo-point
- `GET /api/v1/addresses` - Get all customer addresses
- `PATCH /api/v1/addresses/:id` - Update address
- `DELETE /api/v1/addresses/:id` - Delete address
- `PATCH /api/v1/addresses/:id/set-default` - Set default address

**Create Address Request:**
```json
{
  "label": "Home",
  "addressText": "House 123, Street X, Mirpur",
  "geo": {
    "lat": 33.148,
    "lng": 73.751
  },
  "phone": "+923001234567",
  "isDefault": true
}
```

### Product Search

- `GET /api/v1/products/search?q=milk&lat=33.148&lng=73.751&radius=5000` - Global product search

**Query Parameters:**
- `q` (required) - Search query
- `lat`, `lng` (optional) - Customer location for nearby search
- `radius` (optional) - Search radius in meters (default: 5000)
- `category` (optional) - Filter by category
- `minPrice`, `maxPrice` (optional) - Price range
- `page`, `limit` (optional) - Pagination

### Cart

- `POST /api/v1/cart` - Add item to cart
- `GET /api/v1/cart?merchantId=xxx` - Get cart (all carts or specific merchant)
- `PATCH /api/v1/cart/:merchantId/items/:productId` - Update cart item quantity
- `DELETE /api/v1/cart/:merchantId/items/:productId` - Remove item from cart
- `DELETE /api/v1/cart/:merchantId` - Clear cart for a merchant

**Add to Cart Request:**
```json
{
  "merchantId": "merchant_id",
  "productId": "product_id",
  "qty": 2
}
```

### Checkout

- `POST /api/v1/checkout` - Convert cart to order

**Checkout Request:**
```json
{
  "merchantId": "merchant_id",
  "addressId": "address_id",
  "paymentMethod": "COD",
  "deliverySlot": {
    "date": "2024-01-15",
    "window": "10:00-12:00"
  },
  "note": "Please deliver in the morning"
}
```

### Favorites

- `POST /api/v1/favorites` - Add shop or product to favorites
- `GET /api/v1/favorites?type=shop` - Get favorites (filter by type: shop/product)
- `DELETE /api/v1/favorites/:id` - Remove from favorites

**Add Favorite Request:**
```json
{
  "type": "shop",
  "shopId": "merchant_id"
}
```
or
```json
{
  "type": "product",
  "productId": "product_id"
}
```

### Order History

- `GET /api/v1/orders?status=DELIVERED&page=1&limit=20` - Get customer orders

**Query Parameters:**
- `status` (optional) - Filter by order status
- `dateFrom`, `dateTo` (optional) - Date range filter
- `page`, `limit` (optional) - Pagination

### Feedback & Ratings

- `POST /api/v1/feedback` - Submit feedback for delivered order
- `GET /api/v1/feedback` - Get customer feedback history

**Create Feedback Request:**
```json
{
  "orderId": "order_id",
  "rating": 5,
  "comment": "Great service!",
  "images": ["https://example.com/image.jpg"]
}
```

### Disputes

- `POST /api/v1/disputes` - Open dispute for order
- `GET /api/v1/disputes` - Get customer disputes
- `GET /api/v1/disputes/:id` - Get dispute details
- `POST /api/v1/disputes/:id/comments` - Add comment to dispute

**Create Dispute Request:**
```json
{
  "orderId": "order_id",
  "type": "ORDER_QUALITY",
  "reason": "Items were damaged during delivery"
}
```

**Dispute Types:**
- `ORDER_QUALITY` - Quality issues
- `MISSING_ITEMS` - Missing items
- `WRONG_ITEMS` - Wrong items received
- `PAYMENT_ISSUE` - Payment problems
- `DELIVERY_ISSUE` - Delivery problems
- `OTHER` - Other issues

### Notifications

- `GET /api/v1/notifications?page=1&limit=20&unreadOnly=true` - Get customer notifications
- `PATCH /api/v1/notifications/:id/read` - Mark notification as read
- `PATCH /api/v1/notifications/read-all` - Mark all notifications as read

**Query Parameters:**
- `page`, `limit` (optional) - Pagination
- `unreadOnly` (optional) - Filter unread notifications only

## Socket.IO Events

### Server Emits

- `order:new` → `shop:{merchantId}` - New order placed
- `order:confirm-required` → `customer:{customerId}` - Merchant reviewed order
- `order:accepted` → `customer:{customerId}` - Order accepted
- `order:rejected` → `customer:{customerId}` - Order rejected
- `rider:assigned` → `rider:{riderId}` - Rider assigned to order
- `order:status` → `customer:{customerId}`, `shop:{merchantId}` - Order status update
- `delivery:started` → `customer:{customerId}` - Delivery started
- `delivery:completed` → `customer:{customerId}` - Delivery completed

### Client Emits

Connect with `token` in query or auth:
```
socket.io-client?token=<accessToken>
```

## Postman Collection

Import `postman_collection.json` into Postman for API testing.

## Project Structure

```
src/
├── config/          # Configuration (database, redis, env)
├── middleware/      # Express middleware (auth, error handling)
├── models/          # MongoDB models
├── modules/         # Feature modules
│   ├── auth/
│   ├── merchants/
│   ├── products/
│   ├── product-search/
│   ├── orders/
│   ├── riders/
│   ├── cod-ledger/
│   ├── notifications/
│   ├── customers/
│   ├── addresses/
│   ├── cart/
│   ├── checkout/
│   ├── favorites/
│   ├── feedback/
│   └── disputes/
├── socket/          # Socket.IO setup
├── jobs/            # Background jobs
├── utils/           # Utilities (JWT, email, cache, etc.)
├── scripts/         # Seed scripts
└── index.ts          # Main server file
```

## Environment Variables

See `.env.example` for all required environment variables.

## Customer API Flow Summary

### Complete Customer Journey

1. **Authentication** → `POST /api/v1/auth/send-otp` → `POST /api/v1/auth/verify-otp`
2. **Profile Setup** → `GET /api/v1/customers/profile` → `PATCH /api/v1/customers/profile`
3. **Add Address** → `POST /api/v1/addresses` (with geo-point)
4. **Discover Shops** → `GET /api/v1/merchants?lat=...&lng=...&radius=5000`
5. **Search Products** → `GET /api/v1/products/search?q=milk&lat=...&lng=...`
6. **Browse Products** → `GET /api/v1/merchants/:id/products`
7. **Add to Cart** → `POST /api/v1/cart`
8. **View Cart** → `GET /api/v1/cart?merchantId=xxx`
9. **Checkout** → `POST /api/v1/checkout` (converts cart to order)
10. **Track Order** → `GET /api/v1/orders` (real-time updates via Socket.IO)
11. **Provide Feedback** → `POST /api/v1/feedback` (after delivery)
12. **Open Dispute** → `POST /api/v1/disputes` (if needed)
13. **View Notifications** → `GET /api/v1/notifications`

### Key Features

- **Multi-shop Cart**: Each merchant has a separate cart
- **Geo-based Discovery**: Find shops and products within delivery radius
- **Real-time Updates**: Socket.IO events for order status changes
- **Address Management**: Multiple addresses with default selection
- **Favorites**: Save favorite shops and products
- **Feedback System**: Rate and review delivered orders
- **Dispute Resolution**: Open disputes with merchant/admin mediation

## License

ISC

