import { Schema, model, Document, Types } from "mongoose";
import { PaymentStatus } from "../enum/payment.status.js";
import { PaymentProvider } from "../enum/payment.provider.js";

export class PurchaseClass extends Document {
  userId!: Types.ObjectId;
  items!: Array<{ itemId: Types.ObjectId; name: string; price: number; qty: number }>;
  subtotal!: number;
  total!: number;
  paymentStatus!: PaymentStatus;
  paymentProvider!: PaymentProvider;
  fech_creacion!: Date;
  fech_modif!: Date;
}

const purchaseSchema = new Schema<PurchaseClass>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 }
      }
    ],
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    paymentProvider: {
      type: String,
      enum: Object.values(PaymentProvider),
      required: true
    }
  },
  { timestamps: { createdAt: "fech_creacion", updatedAt: "fech_modif" }, versionKey: false }
);

purchaseSchema.loadClass(PurchaseClass);
export const PurchaseModel = model<PurchaseClass>("Purchase", purchaseSchema);
