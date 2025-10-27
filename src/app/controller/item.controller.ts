import { Request, Response } from "express";
import { Logger } from "../config/logger.js";
import { ItemService } from "../services/item.service.js";


type AuthUser = { id: string; role?: string };

export class ItemController {
  constructor(private readonly service: ItemService) {}

  async create(req: Request, res: Response) {
    Logger.info("ItemController.create :: iniciando");
    try {
      const user = (req as any).user as AuthUser | undefined;

      const dto = {
        ...req.body,
        createdBy: user?.id ?? "system",
      };

      const response = await this.service.create(dto);
      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("ItemController.create :: error", err);
      return res
        .status(400)
        .json({ message: "No se pudo crear el ítem", error: String(err) });
    }
  }

  async findAll(req: Request, res: Response) {
    Logger.info("ItemController.findAll :: iniciando");
    try {
      const { q, page, limit, type, category } = req.query as {
        q?: string;
        page?: string;
        limit?: string;
        type?: string;
        category?: string;
      };

      const response = await this.service.list({
        q,
        type,
        category,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("ItemController.findAll :: error", err);
      return res
        .status(500)
        .json({ message: "Error listando ítems", error: String(err) });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.getById(id);
      if (!response) {
        return res.status(404).json({ message: "Ítem no encontrado" });
      }
      return res.status(response.code).json(response);
    } catch (err) {
      return res.status(400).json({ message: "ID inválido", error: String(err) });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user as AuthUser | undefined;

      const dto = {
        ...req.body,
        updatedBy: user?.id ?? "system",
      };

      const response = await this.service.updateById(id, dto);
      if (!response) {
        return res.status(404).json({ message: "Ítem no encontrado" });
      }
      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("ItemController.update :: error", err);
      return res
        .status(400)
        .json({ message: "No se pudo actualizar", error: String(err) });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.removeById(id);
      if (!response) {
        return res.status(404).json({ message: "Ítem no encontrado" });
      }
      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("ItemController.delete :: error", err);
      return res
        .status(500)
        .json({ message: "No se pudo eliminar", error: String(err) });
    }
  }

  async distinctCategories(_req: Request, res: Response) {
    try {
      const response = await this.service.getDistinctCategories();
      return res.status(response.code).json(response);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error obteniendo categorías", error: String(err) });
    }
  }

  async distinctTypes(_req: Request, res: Response) {
    try {
      const response = await this.service.getDistinctTypes();
      return res.status(response.code).json(response);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error obteniendo tipos", error: String(err) });
    }
  }
}
