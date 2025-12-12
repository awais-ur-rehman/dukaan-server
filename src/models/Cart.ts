import mongoose, { Schema, Document } from 'mongoose';

export interface CartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  unit?: string;
  imageUrl?: string;
}

export interface ICart extends Document {
  customerId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  items: CartItem[];
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<CartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    unit: { type: String },
    imageUrl: { type: String },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    items: [CartItemSchema],
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CartSchema.index({ customerId: 1, merchantId: 1 }, { unique: true });

export const Cart = mongoose.model<ICart>('Cart', CartSchema);

