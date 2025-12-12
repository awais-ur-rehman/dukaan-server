import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethod = 'COD' | 'DROP_AT_DOOR' | 'DOOR_WALLET';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
export type OrderStatus =
  | 'PLACED'
  | 'MERCHANT_ACCEPTED'
  | 'MERCHANT_REJECTED'
  | 'AWAITING_CUSTOMER_CONFIRM'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface CustomerSnapshot {
  name: string;
  phone: string;
  addressText: string;
  geo: {
    lng: number;
    lat: number;
  };
  note?: string;
}

export interface OrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  unit?: string;
  subtotal: number;
}

export interface DeliverySlot {
  date: string;
  window: string;
}

export interface POD {
  imageUrl?: string;
  otp?: string;
  deliveredAt?: Date;
  note?: string;
}

export interface OrderLog {
  actor: mongoose.Types.ObjectId | null;
  type: string;
  message: string;
  at: Date;
}

export interface Dispute {
  openedBy: mongoose.Types.ObjectId;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  adminNotes?: string;
}

export interface IOrder extends Document {
  clientOrderId?: string;
  merchantId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerSnapshot: CustomerSnapshot;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount?: number;
  tax?: number;
  total: number;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    providerTxId?: string;
  };
  status: OrderStatus;
  deliverySlot: DeliverySlot;
  assignedRiderId?: mongoose.Types.ObjectId;
  pod: POD;
  logs: OrderLog[];
  dispute?: Dispute;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    clientOrderId: { type: String, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressText: { type: String, required: true },
      geo: {
        lng: { type: Number, required: true },
        lat: { type: Number, required: true },
      },
      note: { type: String },
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1 },
        unit: { type: String },
        subtotal: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0 },
    discount: { type: Number, min: 0 },
    tax: { type: Number, min: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: {
      method: {
        type: String,
        enum: ['COD', 'DROP_AT_DOOR', 'DOOR_WALLET'],
        required: true,
      },
      status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING',
      },
      providerTxId: { type: String },
    },
    status: {
      type: String,
      enum: [
        'PLACED',
        'MERCHANT_ACCEPTED',
        'MERCHANT_REJECTED',
        'AWAITING_CUSTOMER_CONFIRM',
        'ASSIGNED',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'CANCELLED',
      ],
      default: 'PLACED',
    },
    deliverySlot: {
      date: { type: String, required: true },
      window: { type: String, required: true },
    },
    assignedRiderId: { type: Schema.Types.ObjectId, ref: 'Rider' },
    pod: {
      imageUrl: { type: String },
      otp: { type: String },
      deliveredAt: { type: Date },
      note: { type: String },
    },
    logs: [
      {
        actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        type: { type: String, required: true },
        message: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    dispute: {
      openedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String },
      status: {
        type: String,
        enum: ['OPEN', 'RESOLVED', 'CLOSED'],
      },
      adminNotes: { type: String },
    },
  },
  { timestamps: true }
);

OrderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

