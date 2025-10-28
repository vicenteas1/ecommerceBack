import { Request, Response } from 'express';
import { Logger } from '../config/logger.js';
import type { PaymentService } from '../services/payment.service.js';

type AuthUser = { id: string; role?: string };

export class PaymentsController {
  constructor(private readonly service: PaymentService) {}

  async createPreference(req: Request, res: Response) {
    Logger.info("PaymentsController.createPreference :: iniciando");
    try {
      const user = (req as any).user as AuthUser | undefined;
      const dto = {
        items: req.body?.items ?? [],
        payer: req.body?.payer,
        createdBy: user?.id,
      };
      const response = await this.service.createPreference(dto);
      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("PaymentsController.createPreference :: error", err);
      return res.status(500).json({ message: "No se pudo crear la preferencia", error: String(err) });
    }
  }

  async findAll(req: Request, res: Response) {
    Logger.info("PaymentsController.findAll :: iniciando");
    try {
      const { page, limit, status, user } = req.query as {
        page?: string; limit?: string; status?: string; user?: string;
      };
      const response = await this.service.list({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status,
        user,
      });
      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("PaymentsController.findAll :: error", err);
      return res.status(500).json({ message: "Error listando pagos", error: String(err) });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.getById(id);
      if (!response) return res.status(404).json({ message: "Pago no encontrado" });
      return res.status(response.code).json(response);
    } catch (err) {
      return res.status(400).json({ message: "ID inválido", error: String(err) });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user as AuthUser | undefined;
      const dto = { ...req.body, updatedBy: user?.id ?? "system" };
      const response = await this.service.updateById(id, dto);
      if (!response) return res.status(404).json({ message: "Pago no encontrado" });
      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("PaymentsController.update :: error", err);
      return res.status(400).json({ message: "No se pudo actualizar el pago", error: String(err) });
    }
  }

  async webhook(req: Request, res: Response) {
    Logger.info("PaymentsController.webhook :: recibido");
    try {
      const response = await this.service.processWebhook(req.body, req.query as any);
      return res.status(200).json(response);
    } catch (err) {
      Logger.error("PaymentsController.webhook :: error", err);
      return res.status(200).json({ ok: false, error: String(err) });
    }
  }

  async confirm(req: Request, res: Response) {
    Logger.info("PaymentsController.confirm :: iniciando");
    try {
      const response = await this.service.confirmFromReturn(req.query as any);
      return res.status(response.code).json(response);
    } catch (err) {
      Logger.error("PaymentsController.confirm :: error", err);
      return res.status(500).json({ message: "Error confirmando pago", error: String(err) });
    }
  }
}
