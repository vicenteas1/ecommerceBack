import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import { ApiResponse } from '../models/api-response.model.js';
import { Logger } from '../config/logger.js';
import type { UserService } from '../services/user.service.js';
import { UserRole } from '../models/role.model.js';
import { AuthUser } from '../interfaces/user.interface.js';
import { HttpStatus } from '../enum/http.status.js';

export class UserController {
  constructor(private readonly service: UserService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    Logger.info("UserController.create :: iniciando");
    try {
      const dto = matchedData(req, { locations: ["body"] }) as
        Pick<AuthUser, "username" | "email" | "password"> & { role?: UserRole };

      const createdBy = req.user?.id ?? process.env.SYSTEM_USER_ID ?? "system";
      const response = await this.service.create({ ...dto, createdBy });

      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    Logger.info("UserController.login :: iniciando");
    try {
      const dto = matchedData(req, { locations: ["body"] }) as AuthUser;;
      const response = await this.service.login(dto);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async verifytoken(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(HttpStatus.UNAUTHORIZED).json(ApiResponse.fail("Acceso no autorizado", HttpStatus.UNAUTHORIZED));
      }
      const response = await this.service.verifyToken(req.user, false);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const dto = matchedData(req, { locations: ["body"] }) as {
        username?: string; email?: string; role?: UserRole;
      };

      const isAdmin = req.user?.role === "admin";
      const safeDto = isAdmin ? dto : { username: dto.username, email: dto.email };

      const response = await this.service.updateById(id, { ...safeDto, updatedBy: req.user?.id ?? "system" });
      if (!response) {
        return res.status(HttpStatus.NOT_FOUND).json(ApiResponse.fail("Usuario no encontrado", HttpStatus.NOT_FOUND));
      }
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async getInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const response = await this.service.getById(id);
      if (!response) {
        return res.status(HttpStatus.NOT_FOUND).json(ApiResponse.fail("Usuario no encontrado", HttpStatus.NOT_FOUND));
      }
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.service.list();
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const response = await this.service.removeById(id);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(HttpStatus.UNAUTHORIZED).json(ApiResponse.fail("No autenticado", HttpStatus.UNAUTHORIZED));
      }
      const dto = matchedData(req, { locations: ["body"] }) as {
        oldPassword: string; newPassword: string;
      };
      const response = await this.service.changePassword(req.user.id, dto.oldPassword, dto.newPassword);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }
}
