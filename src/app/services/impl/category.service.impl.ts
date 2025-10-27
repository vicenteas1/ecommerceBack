import { ICategoryService, ICategory } from "../../interfaces/category.interface.js";
import { CategoryModel } from "../../models/category.model.js";
import { TypeModel } from "../../models/type.model.js";
import { Logger } from "../../config/logger.js";
import { ApiResponse } from "../../models/api-response.model.js";
import { HttpStatus } from "../../enum/http.status.js";
import { Types } from "mongoose";

const slugify = (v: string) =>
  v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

export class CategoryService implements ICategoryService {  
  async create(data: { nombre: string; typeId: string; createdBy: string }) {
    const nombre = data.nombre?.trim();
    if (!nombre) return ApiResponse.fail("nombre obligatorio", HttpStatus.BAD_REQUEST);

    if (!Types.ObjectId.isValid(data.typeId)) {
      return ApiResponse.fail("typeId inválido", HttpStatus.BAD_REQUEST);
    }
    if (!Types.ObjectId.isValid(data.createdBy)) {
      return ApiResponse.fail("createdBy inválido", HttpStatus.BAD_REQUEST);
    }
    const type = await TypeModel.findById(data.typeId).select("_id").lean();
    if (!type) {
      return ApiResponse.fail("El tipo asociado no existe", HttpStatus.BAD_REQUEST);
    }

    const saved = await CategoryModel.create({
      nombre,
      slug: slugify(nombre),
      type: new Types.ObjectId(data.typeId),
      createdBy: new Types.ObjectId(data.createdBy),
      updatedBy: new Types.ObjectId(data.createdBy),
    });

    return ApiResponse.ok(saved.toJSON(), HttpStatus.CREATED, "Categoría creada");
  }

  async list(filter?: { typeId?: string; typeSlug?: string }) {
    try {
      let query: any = {};

      if (filter?.typeId) query.type = filter.typeId;
      else if (filter?.typeSlug) {
        const typeDoc = await TypeModel.findOne({ slug: filter.typeSlug });
        if (typeDoc) query.type = typeDoc._id;
      }

      const categories = await CategoryModel.find(query)
        .populate({ path: "type", select: "nombre slug" })
        .lean();

      return {
        code: 200,
        message: "OK",
        data: { items: categories },
      };
    } catch (error) {
      Logger.error("Error listando categorías:", error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const category = await CategoryModel.findById(id)
        .populate({ path: "type", select: "nombre slug" })
        .lean();

      if (!category)
        return { code: 404, message: "Categoría no encontrada" };

      return { code: 200, message: "OK", data: category };
    } catch (error) {
      Logger.error("Error obteniendo categoría:", error);
      throw error;
    }
  }

  async updateById(id: string, data: Partial<ICategory>) {
    try {
      if (data.nombre) {
        data.slug = data.nombre
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-");
      }

      const updated = await CategoryModel.findByIdAndUpdate(id, data, {
        new: true,
      }).populate({ path: "type", select: "nombre slug" });

      if (!updated)
        return { code: 404, message: "Categoría no encontrada" };

      return { code: 200, message: "Categoría actualizada", data: updated };
    } catch (error) {
      Logger.error("Error actualizando categoría:", error);
      throw error;
    }
  }

  async removeById(id: string) {
    try {
      const deleted = await CategoryModel.findByIdAndDelete(id);
      if (!deleted)
        return { code: 404, message: "Categoría no encontrada" };

      return { code: 200, message: "Categoría eliminada", data: { deleted: true } };
    } catch (error) {
      Logger.error("Error eliminando categoría:", error);
      throw error;
    }
  }

  async getDistinctByType(filter?: { typeId?: string; typeSlug?: string }) {
    try {
      let query: any = {};

      if (filter?.typeId) query.type = filter.typeId;
      else if (filter?.typeSlug) {
        const typeDoc = await TypeModel.findOne({ slug: filter.typeSlug });
        if (typeDoc) query.type = typeDoc._id;
      }

      const categories = await CategoryModel.find(query)
        .select("nombre slug")
        .lean();

      const unique = [...new Set(categories.map((c) => c.nombre))];

      return {
        code: 200,
        message: "OK",
        data: unique,
      };
    } catch (error) {
      Logger.error("Error obteniendo categorías por tipo:", error);
      throw error;
    }
  }
}
