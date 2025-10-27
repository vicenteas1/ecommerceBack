import { Schema, model, Document, Types } from 'mongoose';

export type TypeNombre = "producto" | "servicio";

export class TypeClass extends Document {
  nombre!: TypeNombre;
  slug!: string;
  createdBy!: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  fech_creacion!: Date;
  fech_modif!: Date;
}

const typeSchema = new Schema<TypeClass>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["producto", "servicio"],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "types",
    timestamps: { createdAt: "fech_creacion", updatedAt: "fech_modif" },
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { ret.id = ret._id; delete ret._id; },
    },
  }
);

typeSchema.pre("validate", function (next) {
  if (!this.get("slug") && this.get("nombre")) {
    this.set("slug", String(this.get("nombre")).trim().toLowerCase().replace(/\s+/g, "-"));
  }
  next();
});

typeSchema.index({ nombre: 1 }, { unique: true });
typeSchema.index({ slug: 1 }, { unique: true });
typeSchema.index({ nombre: "text" });

export const TypeModel = model<TypeClass>("Type", typeSchema);
