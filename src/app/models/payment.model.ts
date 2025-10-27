import { Schema, model, Document, Types } from 'mongoose';

export class PaymentClass extends Document {
  user?: Types.ObjectId;
  items!: Array<{ title: string; quantity: number; unit_price: number; currency_id?: string }>;
  amount!: number;
  currency_id!: string;
  preferenceId!: string;
  paymentId?: string;
  status!: string;
  payerEmail?: string;

  createdBy!: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  fech_creacion!: Date;
  fech_modif!: Date;

  computeTotal(): number {
    return (this.items || []).reduce((acc, it: any) => {
      const qty = Math.max(0, Number(it.quantity || 0));
      const price = Math.max(0, Number(it.unit_price || 0));
      return acc + qty * price;
    }, 0);
  }
}

const PaymentItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    currency_id: { type: String, default: "CLP", trim: true },
  },
  { _id: false }
);

const paymentSchema = new Schema<PaymentClass>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },

    items: { type: [PaymentItemSchema], required: true, validate: (arr: any[]) => Array.isArray(arr) && arr.length > 0 },

    amount: { type: Number, required: true, min: 0, default: 0 },
    currency_id: { type: String, default: "CLP", trim: true },

    preferenceId: { type: String, required: true, unique: true, index: true, trim: true },
    paymentId: { type: String, index: true, sparse: true, trim: true },

    status: {
      type: String,
      enum: ["pending","approved","authorized","in_process","in_mediation","rejected","cancelled","refunded","charged_back"],
      default: "pending",
      required: true,
    },

    payerEmail: { type: String, trim: true, lowercase: true },

    createdBy: { type: Schema.Types.ObjectId, required: true },
    updatedBy: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: { createdAt: "fech_creacion", updatedAt: "fech_modif" },
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        const { _id, __v, ...rest } = ret;
        return { id: _id, ...rest };
      },
    },
  }
);

paymentSchema.index({ user: 1, fech_creacion: -1 });
paymentSchema.index({ status: 1, fech_creacion: -1 });

paymentSchema.pre("save", function () {
  const self = this as PaymentClass;
  self.amount = self.computeTotal();
  const firstCurrency = self.items?.[0]?.currency_id || "CLP";
  self.currency_id = firstCurrency;
});

paymentSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  if (update?.items && Array.isArray(update.items)) {
    const total = update.items.reduce((acc: number, it: any) => {
      const qty = Math.max(0, Number(it?.quantity || 0));
      const price = Math.max(0, Number(it?.unit_price || 0));
      return acc + qty * price;
    }, 0);
    update.amount = total;
    if (update.items[0]?.currency_id) update.currency_id = update.items[0].currency_id;
    this.setUpdate(update);
  }
  next();
});

paymentSchema.loadClass(PaymentClass);

export const PaymentModel = model<PaymentClass>("Payment", paymentSchema);
