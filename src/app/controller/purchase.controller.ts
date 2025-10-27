import { Request, Response, NextFunction } from "express";
import { matchedData } from "express-validator";
import { ApiResponse } from "../models/api-response.model.js";
import type { PaymentStatus } from "../enum/payment.status.js";
import type { PaymentProvider } from "../enum/payment.provider.js";
import { PurchaseService } from "../services/purchase.service.js";
import { HttpStatus } from "enum/http.status.js";

export class PurchaseController {
  constructor(private readonly service: PurchaseService) {}

  async listMyPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) return res.status(HttpStatus.UNAUTHORIZED).json(ApiResponse.fail("No autenticado", HttpStatus.UNAUTHORIZED));

      const q = matchedData(req, { locations: ["query"] }) as {
        page?: number | string;
        limit?: number | string;
        paymentStatus?: PaymentStatus;
      };

      const response = await this.service.listMyPurchases(req.user.id, {
        page: q.page ? Number(q.page) : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
        paymentStatus: q.paymentStatus,
      });

      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async getMyPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) return res.status(HttpStatus.UNAUTHORIZED).json(ApiResponse.fail("No autenticado", HttpStatus.UNAUTHORIZED));
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const response = await this.service.getMyPurchase(id, req.user.id);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async createPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) return res.status(HttpStatus.UNAUTHORIZED).json(ApiResponse.fail("No autenticado", HttpStatus.UNAUTHORIZED));

      const dto = matchedData(req, { locations: ["body"] }) as {
        items: Array<{ productId: string; qty: number; price: number; name?: string }>;
        paymentProvider: PaymentProvider;
      };

      const response = await this.service.createPurchase({
        userId: req.user.id,
        items: dto.items,
        paymentProvider: dto.paymentProvider,
      });

      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async cancelPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) return res.status(HttpStatus.UNAUTHORIZED).json(ApiResponse.fail("No autenticado", HttpStatus.UNAUTHORIZED));
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const response = await this.service.cancelPurchase(id, req.user.id);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }
}
