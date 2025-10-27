import { Request, Response } from "express";
import { Logger } from "../config/logger.js";
import { CategoryService } from "../services/impl/category.service.impl.js";

export class CategoryController {
    constructor(private service: CategoryService) { }

    async create(req: Request, res: Response) {
        Logger.info("Iniciando creación de categoría");
        try {
            const user = (req as any).user;
            const response = await this.service.create({
                ...req.body,
                createdBy: user?.id,
            });
            res.status(response.code).json(response);
        } catch (err) {
            Logger.error("Error al crear categoría:", err);
            res
                .status(400)
                .json({ message: "No se pudo crear la categoría", error: String(err) });
        }
    }

    /** Listar todas las categorías */
    async readAll(req: Request, res: Response) {
        Logger.info("Iniciando lectura de todas las categorías");
        try {
            const { typeId, typeSlug } = req.query as { typeId?: string; typeSlug?: string };
            const response = await this.service.list({ typeId, typeSlug });
            res.status(response.code).json(response);
        } catch (err) {
            Logger.error("Error listando categorías:", err);
            res
                .status(500)
                .json({ message: "Error listando categorías", error: String(err) });
        }
    }

    /** Obtener una categoría por ID */
    async readOne(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const response = await this.service.getById(id);
            if (!response)
                return res.status(404).json({ message: "Categoría no encontrada" });
            res.status(response.code).json(response);
        } catch (err) {
            res.status(400).json({ message: "ID inválido", error: String(err) });
        }
    }

    /** Actualizar categoría */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const response = await this.service.updateById(id, {
                ...req.body,
                updatedBy: user?.id,
            });
            if (!response)
                return res.status(404).json({ message: "Categoría no encontrada" });
            res.status(response.code).json(response);
        } catch (err) {
            Logger.error("Error actualizando categoría:", err);
            res
                .status(400)
                .json({ message: "No se pudo actualizar", error: String(err) });
        }
    }

    /** Eliminar categoría */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const response = await this.service.removeById(id);
            if (!response)
                return res.status(404).json({ message: "Categoría no encontrada" });
            res.status(response.code).json(response);
        } catch (err) {
            Logger.error("Error eliminando categoría:", err);
            res
                .status(500)
                .json({ message: "No se pudo eliminar", error: String(err) });
        }
    }

    /** Obtener todas las categorías distintas por tipo */
    async distinctByType(req: Request, res: Response) {
        try {
            const { typeId, typeSlug } = req.query as { typeId?: string; typeSlug?: string };
            const response = await this.service.getDistinctByType({ typeId, typeSlug });
            res.status(response.code).json(response);
        } catch (err) {
            Logger.error("Error obteniendo categorías por tipo:", err);
            res.status(500).json({
                message: "Error obteniendo categorías por tipo",
                error: String(err),
            });
        }
    }
}
