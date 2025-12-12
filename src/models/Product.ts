import mongoose, { Schema, Document } from 'mongoose';

export interface MultilingualText {
  en: string;
  ur?: string;
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface IProduct extends Document {
  merchantId: mongoose.Types.ObjectId;
  sku?: string;
  names: MultilingualText;
  description?: MultilingualText;
  images: ProductImage[];
  price: number;
  stock: number;
  unit?: string;
  category?: string;
  tags?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    sku: { type: String, trim: true },
    names: {
      en: { type: String, required: true },
      ur: { type: String },
    },
    description: {
      en: { type: String },
      ur: { type: String },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    unit: { type: String },
    category: { type: String },
    tags: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ merchantId: 1 });
ProductSchema.index({ 'names.en': 'text', 'description.en': 'text', tags: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

