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
│   ├── orders/
│   ├── riders/
│   ├── cod-ledger/
│   └── notifications/
├── socket/          # Socket.IO setup
├── jobs/            # Background jobs
├── utils/           # Utilities (JWT, email, cache, etc.)
├── scripts/         # Seed scripts
└── index.ts          # Main server file
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

ISC

