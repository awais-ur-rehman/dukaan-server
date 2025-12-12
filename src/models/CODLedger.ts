import mongoose, { Schema, Document } from 'mongoose';

export type CODLedgerStatus = 'PENDING' | 'COLLECTED' | 'SETTLED' | 'DISPUTED';

export interface ICODLedger extends Document {
  merchantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  amount: number;
  collectedByRiderId?: mongoose.Types.ObjectId;
  collectedAt?: Date;
  status: CODLedgerStatus;
  proofImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CODLedgerSchema = new Schema<ICODLedger>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true, min: 0 },
    collectedByRiderId: { type: Schema.Types.ObjectId, ref: 'Rider' },
    collectedAt: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'COLLECTED', 'SETTLED', 'DISPUTED'],
      default: 'PENDING',
    },
    proofImageUrl: { type: String },
  },
  { timestamps: true }
);

CODLedgerSchema.index({ merchantId: 1, status: 1 });

export const CODLedger = mongoose.model<ICODLedger>('CODLedger', CODLedgerSchema);

