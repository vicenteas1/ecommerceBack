// src/app/controller/type.controller.ts
import { Request, Response } from "express";
import { Logger } from "../config/logger.js";
import { TypeService } from "../services/type.service.js";

type AuthUser = { id: string; role?: string };

export class TypeController {
  constructor(private service: TypeService) {}

  async create(req: Request, res: Response) {
    Logger.info("Iniciando creación de tipo");
    try {
      const user = (req as any).user as AuthUser | undefined;
      if (!user?.id) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const { nombre } = req.body ?? {};
      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({ message: "nombre es obligatorio" });
      }

      const response = await this.service.create({
        nombre,
        createdBy: user.id,
      });

      res.status(response.code).json(response);
    } catch (err) {
      Logger.error("Error al crear tipo:", err);
      res.status(400).json({ message: "No se pudo crear el tipo", error: String(err) });
    }
  }

  async readAll(_req: Request, res: Response) {
    Logger.info("Iniciando lectura de todos los tipos");
    try {
      const response = await this.service.list();
      res.status(response.code).json(response);
    } catch (err) {
      Logger.error("Error listando tipos:", err);
      res.status(500).json({ message: "Error listando tipos", error: String(err) });
    }
  }

  async readOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.getById(id);
      if (!response) return res.status(404).json({ message: "Tipo no encontrado" });
      res.status(response.code).json(response);
    } catch (err) {
      res.status(400).json({ message: "ID inválido", error: String(err) });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user as AuthUser | undefined;
      if (!user?.id) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const update: { nombre?: string; updatedBy: string } = {
        updatedBy: user.id,
      };
      if (typeof req.body?.nombre === "string") {
        update.nombre = req.body.nombre;
      }

      const response = await this.service.updateById(id, update);
      if (!response) return res.status(404).json({ message: "Tipo no encontrado" });
      res.status(response.code).json(response);
    } catch (err) {
      Logger.error("Error actualizando tipo:", err);
      res.status(400).json({ message: "No se pudo actualizar", error: String(err) });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.removeById(id);
      if (!response) return res.status(404).json({ message: "Tipo no encontrado" });
      res.status(response.code).json(response);
    } catch (err) {
      Logger.error("Error eliminando tipo:", err);
      res.status(500).json({ message: "No se pudo eliminar", error: String(err) });
    }
  }
}
