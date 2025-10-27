import { Schema, model, Document, Types } from 'mongoose';
import { CategoryModel } from './category.model.js';
import { TypeModel } from './type.model.js';

export class ItemClass extends Document {
  nombre!: string;
  descripcion!: string;
  precio!: number;

  type!: Types.ObjectId;
  category!: Types.ObjectId;

  stock?: number;

  createdBy!: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  fech_creacion!: Date;
  fech_modif!: Date;
}

const itemSchema = new Schema<ItemClass>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: Schema.Types.ObjectId,
      ref: "Type",
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    stock: {
      type: Number,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
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
      },
    },
  }
);

itemSchema.index({ nombre: "text", descripcion: "text" });
itemSchema.index({ type: 1, category: 1 });
itemSchema.pre("validate", async function (next) {
  const typeId = this.get("type");
  const categoryId = this.get("category");

  if (!typeId || !categoryId) return next();

  const [cat, type] = await Promise.all([
    CategoryModel.findById(categoryId).select("type").lean(),
    TypeModel.findById(typeId).select("_id").lean(),
  ]);

  if (!cat || !type) return next();

  if (String(cat.type) !== String(type._id)) {
    return next(
      new Error("La categoría seleccionada no pertenece al mismo tipo del ítem.")
    );
  }

  next();
});

export const ItemModel = model<ItemClass>("Item", itemSchema, "items");
