import { SaleStatus } from '../enum/sales.status.js';
import { PaymentStatus } from '../enum/payment.status.js';
import { PaymentProvider } from '../enum/payment.provider.js';
import { Schema, model, Document, Types } from 'mongoose';


export class SaleClass extends Document {
  userId!: Types.ObjectId;
  items!: Array<{ itemId: Types.ObjectId; name: string; price: number; qty: number }>;
  subtotal!: number;
  taxes!: number;
  total!: number;
  status!: SaleStatus;
  paymentStatus!: PaymentStatus;
  paymentProvider!: PaymentProvider;
  checkoutSessionId?: string;

  fech_creacion!: Date;
  fech_modif!: Date;
}

const saleSchema = new Schema<SaleClass>(
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
    taxes: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: Object.values(SaleStatus),
      default: SaleStatus.NUEVO,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    paymentProvider: {
      type: String,
      enum: Object.values(PaymentProvider),
      required: true
    },
    checkoutSessionId: { type: String }
  },
  {
    timestamps: { createdAt: "fech_creacion", updatedAt: "fech_modif" },
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

saleSchema.loadClass(SaleClass);
export const SaleModel = model<SaleClass>("Sale", saleSchema);
