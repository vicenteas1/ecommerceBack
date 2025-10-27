import { Types } from "mongoose";
import { Logger } from "../../config/logger.js";
import { ApiResponse } from "../../models/api-response.model.js";
import { HttpStatus } from "../../enum/http.status.js";
import { TypeModel, TypeClass } from "../../models/type.model.js";

import { TypeService } from "../../services/type.service.js";
import {   SafeType, CreateTypeDTO, UpdateTypeDTO } from "../../types/type.type.js";

const norm = (v?: string) =>
  (v ?? "").trim().toLowerCase();

const slugify = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

export class TypeServiceImpl implements TypeService {
  async create(data: CreateTypeDTO) : Promise<ApiResponse<SafeType | null>> {
    try {
      const nombre = norm(data.nombre);
      if (!nombre) return ApiResponse.fail("nombre es obligatorio", HttpStatus.BAD_REQUEST);
      if (!Types.ObjectId.isValid(data.createdBy)) {
        return ApiResponse.fail("createdBy inválido", HttpStatus.BAD_REQUEST);
      }

      const slug = slugify(nombre);

      const exists = await TypeModel.exists({ $or: [{ nombre }, { slug }] });
      if (exists) return ApiResponse.fail("El tipo ya existe", HttpStatus.BAD_REQUEST);

      const saved = await TypeModel.create({
        nombre,
        slug,
        createdBy: new Types.ObjectId(data.createdBy),
        updatedBy: new Types.ObjectId(data.createdBy),
      });

      return ApiResponse.ok<SafeType>(this.toSafe(saved), HttpStatus.CREATED, "Tipo creado");
    } catch (err: any) {
      Logger.error(`TypeService.create error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? "No se pudo crear el tipo", HttpStatus.BAD_REQUEST);
    }
  }

  async list(): Promise<ApiResponse<SafeType[]>> {
    try {
      const docs = await TypeModel.find().sort({ nombre: 1 }).lean();
      const items = docs.map((d) => this.toSafe(d as unknown as TypeClass));
      return ApiResponse.ok<SafeType[]>(items, HttpStatus.OK, "OK");
    } catch (err: any) {
      Logger.error(`TypeService.list error: ${err?.message ?? err}`);
      return ApiResponse.fail("No se pudieron listar tipos", HttpStatus.INTERNAL_ERROR) as any;
    }
  }

  async getById(id: string): Promise<ApiResponse<SafeType | null>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail("ID inválido", HttpStatus.BAD_REQUEST);
      const doc = await TypeModel.findById(id).lean();
      if (!doc) return ApiResponse.fail("Tipo no encontrado", HttpStatus.NOT_FOUND);
      return ApiResponse.ok<SafeType>(this.toSafe(doc as unknown as TypeClass), HttpStatus.OK, "OK");
    } catch (err: any) {
      return ApiResponse.fail(err?.message ?? "NOK", HttpStatus.INTERNAL_ERROR);
    }
  }

  async updateById(id: string, update: UpdateTypeDTO): Promise<ApiResponse<SafeType | null>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail("ID inválido", HttpStatus.BAD_REQUEST);

      const $set: Record<string, unknown> = {};

      if (update.nombre !== undefined) {
        const nombre = norm(update.nombre);
        if (!nombre) return ApiResponse.fail("nombre inválido", HttpStatus.BAD_REQUEST);

        const slug = slugify(nombre);

        // Chequeo de unicidad contra otros documentos
        const dup = await TypeModel.findOne({
          _id: { $ne: id },
          $or: [{ nombre }, { slug }],
        }).lean();
        if (dup) return ApiResponse.fail("Ya existe un tipo con ese nombre/slug", HttpStatus.BAD_REQUEST);

        $set.nombre = nombre;
        $set.slug = slug;
      }

      if (update.updatedBy !== undefined) {
        if (!Types.ObjectId.isValid(update.updatedBy)) {
          return ApiResponse.fail("updatedBy inválido", HttpStatus.BAD_REQUEST);
        }
        $set.updatedBy = new Types.ObjectId(update.updatedBy);
      }

      if (Object.keys($set).length === 0) {
        return ApiResponse.fail("Nada para actualizar", HttpStatus.BAD_REQUEST);
      }

      const updated = await TypeModel.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true });
      if (!updated) return ApiResponse.fail("Tipo no encontrado", HttpStatus.NOT_FOUND);

      return ApiResponse.ok<SafeType>(this.toSafe(updated as TypeClass), HttpStatus.OK, "Actualizado");
    } catch (err: any) {
      return ApiResponse.fail(err?.message ?? "No se pudo actualizar", HttpStatus.INTERNAL_ERROR);
    }
  }

  async removeById(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail("ID inválido", HttpStatus.BAD_REQUEST);
      const res = await TypeModel.findByIdAndDelete(id);
      return ApiResponse.ok({ deleted: !!res }, HttpStatus.OK, !!res ? "Eliminado" : "No existía");
    } catch (err: any) {
      return ApiResponse.fail("No se pudo eliminar", HttpStatus.INTERNAL_ERROR);
    }
  }

  // mapper
  private toSafe(t: TypeClass): SafeType {
    return {
      id: (t as any).id ?? (t as any)._id?.toString(),
      nombre: (t as any).nombre,
      slug: (t as any).slug,
      fech_creacion: (t as any).fech_creacion,
      fech_modif: (t as any).fech_modif,
      createdBy: (t as any).createdBy?.toString?.() ?? (t as any).createdBy,
      updatedBy: (t as any).updatedBy?.toString?.() ?? (t as any).updatedBy,
    };
    }
}
