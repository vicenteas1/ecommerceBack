import { Types } from 'mongoose';
import { ApiResponse } from '../../models/api-response.model.js';
import { ItemModel } from '../../models/item.model.js';
import { CategoryModel } from '../../models/category.model.js';
import { TypeModel } from '../../models/type.model.js';

import type {
  CreateItemDTO,
  ListItemsQuery,
  Paged,
  SafeItem,
  UpdateItemDTO,
} from '../../types/item.type.js';
import type { ItemService } from '../item.service.js';

const toSafe = (doc: any): SafeItem => ({
  id: String(doc._id),
  nombre: doc.nombre,
  descripcion: doc.descripcion,
  precio: doc.precio,
  type: doc.type,
  category: doc.category,
  fech_creacion: doc.fech_creacion,
  fech_modif: doc.fech_modif,
  createdBy: doc.createdBy ? String(doc.createdBy) : undefined,
  updatedBy: doc.updatedBy ? String(doc.updatedBy) : undefined,
});

export class ItemServiceImpl implements ItemService {
  async create(data: CreateItemDTO): Promise<ApiResponse<SafeItem | null>> {
    const created = await ItemModel.create(data as any);
    const lean = await ItemModel.findById(created._id).lean();
    return ApiResponse.ok(lean ? toSafe(lean) : null);
  }

  async list(query?: ListItemsQuery): Promise<ApiResponse<Paged<SafeItem>>> {
    const page = Math.max(1, Number(query?.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit ?? 10)));

    const filter: any = {};
    if (query?.type && Types.ObjectId.isValid(query.type)) filter.type = query.type;
    if (query?.category && Types.ObjectId.isValid(query.category)) filter.category = query.category;

    const find = ItemModel.find(filter).lean();

    if (query?.q && String(query.q).trim()) {
      find.where({ $text: { $search: String(query.q).trim() } });
      find.sort({ score: { $meta: "textScore" } });
      find.select({ score: { $meta: "textScore" } } as any);
    } else {
      find.sort({ fech_creacion: -1 });
    }

    const [items, total] = await Promise.all([
      find.skip((page - 1) * limit).limit(limit),
      ItemModel.countDocuments(query?.q ? { ...filter, $text: { $search: String(query.q).trim() } } : filter),
    ]);

    return ApiResponse.ok<Paged<SafeItem>>({
      items: items.map(toSafe),
      total,
      page,
      limit,
    });
  }

async getById(id: string): Promise<ApiResponse<SafeItem | null>> {
  if (!Types.ObjectId.isValid(id)) {
    return ApiResponse.fail("ID inválido", 400, null);
  }

  const doc = await ItemModel.findById(id)
    .populate("type", "nombre slug")
    .populate("category", "nombre slug")
    .lean();

  return doc
    ? ApiResponse.ok(toSafe(doc))
    : ApiResponse.fail("No encontrado", 404, null);
}


  async updateById(id: string, update: UpdateItemDTO): Promise<ApiResponse<SafeItem | null>> {
    if (!Types.ObjectId.isValid(id)) {
      return ApiResponse.fail("ID inválido", 400, null);
    }
    const doc = await ItemModel.findByIdAndUpdate(id, update as any, { new: true, runValidators: true }).lean();
    return doc ? ApiResponse.ok(toSafe(doc)) : ApiResponse.fail("No encontrado", 404, null);
  }

  async removeById(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    if (!Types.ObjectId.isValid(id)) {
      return ApiResponse.fail("ID inválido", 400, { deleted: false });
    }
    const { deletedCount } = await ItemModel.deleteOne({ _id: id });
    return deletedCount
      ? ApiResponse.ok({ deleted: true })
      : ApiResponse.fail("No encontrado", 404, { deleted: false });
  }

  async getDistinctCategories(): Promise<ApiResponse<string[]>> {
    const ids = await ItemModel.distinct("category");
    if (!ids.length) return ApiResponse.ok([]);

    const cats = await CategoryModel.find({ _id: { $in: ids } })
      .select({ nombre: 1 })
      .sort({ nombre: 1 })
      .lean();

    return ApiResponse.ok(cats.map(c => c.nombre));
  }

  async getDistinctTypes(): Promise<ApiResponse<string[]>> {
    const ids = await ItemModel.distinct("type");
    if (!ids.length) return ApiResponse.ok([]);

    const types = await TypeModel.find({ _id: { $in: ids } })
      .select({ nombre: 1 })
      .sort({ nombre: 1 })
      .lean();

    return ApiResponse.ok(types.map(t => t.nombre));
  }
}
