// src/controllers/navbar.controller.ts
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../models/api-response.model.js";
import { NavService } from "../services/navbar.service.js";
import { NavbarRole } from "../interfaces/navbar.interface.js";
import { HttpStatus } from "../enum/http.status.js";

export class NavController {
  constructor(private readonly service: NavService) {}

  async getMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const isAuthenticated = !!req.user?.id;
      const role: NavbarRole = isAuthenticated
        ? (req.user!.role as NavbarRole)
        : "guest";

      const data = this.service.getMenu(role, isAuthenticated);
      return res.status(HttpStatus.OK).json(ApiResponse.ok(data,HttpStatus.OK, "Menú cargado correctamente"));
    } catch (err) {
      next(err);
    }
  }
}
