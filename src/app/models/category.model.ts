import { Schema, model, Document, Types } from 'mongoose';

export class CategoryClass extends Document {
  nombre!: string;
  slug!: string;
  type!: Types.ObjectId;
  createdBy!: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  fech_creacion!: Date;
  fech_modif!: Date;
}

const categorySchema = new Schema<CategoryClass>(
  {
    nombre: { type: String, required: true, trim: true, lowercase: true },
    slug:   { type: String, required: true, trim: true, lowercase: true, unique: true },
    type:   { type: Schema.Types.ObjectId, ref: "Type", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "categories",
    timestamps: { createdAt: "fech_creacion", updatedAt: "fech_modif" },
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { ret.id = ret._id; delete ret._id; },
    },
  }
);

categorySchema.pre("validate", function (next) {
  if (!this.get("slug") && this.get("nombre")) {
    this.set("slug", String(this.get("nombre")).trim().toLowerCase().replace(/\s+/g, "-"));
  }
  next();
});

categorySchema.index({ type: 1, nombre: 1 }, { unique: true });

export const CategoryModel = model<CategoryClass>("Category", categorySchema);
