import mongoose, { Schema, Document } from 'mongoose';

export type FavoriteType = 'shop' | 'product';

export interface IFavorite extends Document {
  customerId: mongoose.Types.ObjectId;
  type: FavoriteType;
  shopId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['shop', 'product'],
      required: true,
    },
    shopId: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  },
  { timestamps: true }
);

FavoriteSchema.index({ customerId: 1, type: 1 });
FavoriteSchema.index({ customerId: 1, shopId: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ customerId: 1, productId: 1 }, { unique: true, sparse: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);

