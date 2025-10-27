import { Request, Response, NextFunction } from "express";
import { matchedData } from "express-validator";
import { ApiResponse } from "../models/api-response.model.js";
import type {
  SaleService,
} from "../services/sales.service.js";
import { SaleStatus } from "../enum/sales.status.js";

export class SaleController {
  constructor(private readonly service: SaleService) {}

  async listMySales(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ApiResponse.fail("No autenticado", 401));
      }
      const q = matchedData(req, { locations: ["query"] }) as {
        page?: number | string;
        limit?: number | string;
      };

      const page = q.page ? Number(q.page) : undefined;
      const limit = q.limit ? Number(q.limit) : undefined;

      const response = await this.service.listMySales(req.user.id, { page, limit });
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async getMySale(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ApiResponse.fail("No autenticado", 401));
      }
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const response = await this.service.getMySale(id, req.user.id);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async listSales(req: Request, res: Response, next: NextFunction) {
    try {
      const q = matchedData(req, { locations: ["query"] }) as {
        from?: string;
        to?: string;
        status?: SaleStatus;
        paymentStatus?: string;
        q?: string;
        page?: number | string;
        limit?: number | string;
      };

      const response = await this.service.listSales({
        from: q.from,
        to: q.to,
        status: q.status as SaleStatus | undefined,
        paymentStatus: q.paymentStatus as any,
        q: q.q,
        page: q.page ? Number(q.page) : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
      });

      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async getSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const response = await this.service.getSale(id);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const { status } = matchedData(req, { locations: ["body"] }) as { status: SaleStatus };

      const response = await this.service.updateStatus(id, status);
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async metricsOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const q = matchedData(req, { locations: ["query"] }) as { from?: string; to?: string };
      const response = await this.service.metricsOverview({ from: q.from, to: q.to });
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }

  async metricsTimeSeries(req: Request, res: Response, next: NextFunction) {
    try {
      const q = matchedData(req, { locations: ["query"] }) as {
        from?: string;
        to?: string;
        interval?: "day" | "week" | "month";
      };
      const response = await this.service.metricsTimeSeries({
        from: q.from,
        to: q.to,
        interval: q.interval,
      });
      return res.status(response.code).json(response);
    } catch (err) {
      return next(err);
    }
  }
}
