import "dotenv/config";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { Types } from "mongoose";
import { randomUUID } from "crypto";

import { Logger } from "../../config/logger.js";
import { ApiResponse } from "../../models/api-response.model.js";
import { HttpStatus } from "../../enum/http.status.js";
import { PaymentModel } from "../../models/payment.model.js";
import { SaleModel } from "../../models/sales.model.js";
import { PurchaseModel } from "../../models/purchase.model.js";

import {
  CreatePreferenceDTO,
  IWebhookPayload,
  IWebhookQuery,
  ListPaymentsFilter,
  UpdatePaymentDTO,
} from "../../interfaces/payment.interface.js";
import { PaymentService } from "../payment.service.js";

const { MP_ACCESS_TOKEN, FRONT_URL, BASE_URL } = process.env as Record<string, string>;

const CURRENCY = "CLP";
const toNumber = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const ensureUrl = (u?: string | null) => {
  if (!u || typeof u !== "string") return null;
  const trimmed = u.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
};

const frontUrl = ensureUrl(FRONT_URL);
const baseUrl = ensureUrl(BASE_URL);

const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN || "",
  options: { timeout: 10000 },
});

export class PaymentServiceImpl implements PaymentService {
  async createPreference(data: CreatePreferenceDTO) {
    try {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        return ApiResponse.fail("items obligatorio", HttpStatus.BAD_REQUEST);
      }

      if (!data.createdBy || !Types.ObjectId.isValid(String(data.createdBy))) {
        return ApiResponse.fail("Usuario no autenticado", HttpStatus.UNAUTHORIZED);
      }

      if (!frontUrl) {
        Logger.error("[MP] FRONT_URL inválida o no definida");
        return ApiResponse.fail("Config inválida: FRONT_URL no definida o inválida (debe incluir http/https)", HttpStatus.INTERNAL_ERROR);
      }

      if (!MP_ACCESS_TOKEN) {
        Logger.error("[MP] MP_ACCESS_TOKEN no definido");
        return ApiResponse.fail("Config inválida: MP_ACCESS_TOKEN no definido", HttpStatus.INTERNAL_ERROR);
      }

      const items = data.items.map((it) => ({
        id: randomUUID(),
        title: String(it.title || "Item"),
        quantity: Math.max(1, toNumber(it.quantity) || 1),
        unit_price: Math.max(0, toNumber(it.unit_price) || 0),
        currency_id: it.currency_id || CURRENCY,
      }));

      const amount = items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);

      const back_urls = {
        success: `${frontUrl}/checkout/success`,
        failure: `${frontUrl}/checkout/failure`,
        pending: `${frontUrl}/checkout/pending`,
      };

      const prefClient = new Preference(mpClient);

      Logger.info(
        "[MP] Preference.create back_urls=%j notification_url=%s",
        back_urls,
        baseUrl ? `${baseUrl}/api/payments/webhook` : "undefined"
      );

      const external_reference = randomUUID();

      const resp = await prefClient.create({
        body: {
          items,
          payer: data.payer || undefined,
          back_urls,
          auto_return: "approved",
          binary_mode: false,
          statement_descriptor: "PROSAAV",
          notification_url: baseUrl ? `${baseUrl}/api/payments/webhook` : undefined,
          external_reference,
          metadata: { createdBy: String(data.createdBy) },
          additional_info: JSON.stringify({
            items: items.map(it => ({
              id: it.id,
              title: it.title,
              quantity: it.quantity,
              unit_price: it.unit_price,
              currency_id: it.currency_id,
            })),
          }),
        },
      });

      const prefId =
        (resp as any)?.id ??
        (resp as any)?.body?.id ??
        (resp as any)?.response?.id;

      const initPoint =
        (resp as any)?.sandbox_init_point ??
        (resp as any)?.init_point ??
        (resp as any)?.body?.init_point ??
        (resp as any)?.response?.init_point;

      if (!prefId || !initPoint) {
        Logger.error("[MP] No retornó id o init_point", resp);
        return ApiResponse.fail("No se pudo crear la preferencia", HttpStatus.INTERNAL_ERROR);
      }

      const now = new Date();
      const saved = await PaymentModel.create({
        items,
        amount,
        currency_id: items[0]?.currency_id || CURRENCY,
        preferenceId: String(prefId),
        status: "pending",
        payerEmail: data.payer?.email,
        external_reference,
        createdBy: new Types.ObjectId(data.createdBy),
        updatedBy: new Types.ObjectId(data.createdBy),
        fech_creacion: now,
        fech_modif: now,
      });

      return ApiResponse.ok(
        {
          id: String(prefId),
          init_point: String(initPoint),
          payment: saved.toJSON(),
        },
        HttpStatus.CREATED,
        "Preferencia creada"
      );
    } catch (error: any) {
      Logger.error("PaymentServiceImpl.createPreference :: error", error);
      const msg = error?.message || "Error creando preferencia";
      return ApiResponse.fail(msg, HttpStatus.INTERNAL_ERROR);
    }
  }

  async list(filter?: ListPaymentsFilter) {
    try {
      const page = Math.max(1, filter?.page || 1);
      const limit = Math.max(1, Math.min(100, filter?.limit || 20));
      const skip = (page - 1) * limit;

      const query: any = {};
      if (filter?.status) query.status = filter.status;
      if (filter?.user) query.user = filter.user;

      const [items, total] = await Promise.all([
        PaymentModel.find(query)
          .sort({ fech_creacion: -1 })
          .skip(skip)
          .limit(limit)
          .populate({ path: "user", select: "username email" })
          .lean(),
        PaymentModel.countDocuments(query),
      ]);

      return ApiResponse.ok(
        { items, page, limit, total, hasMore: skip + items.length < total },
        HttpStatus.OK,
        "OK"
      );
    } catch (error) {
      Logger.error("PaymentServiceImpl.list :: error", error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return ApiResponse.fail("ID inválido", HttpStatus.BAD_REQUEST, null);
      }

      const doc = await PaymentModel.findById(id)
        .populate({ path: "user", select: "username email" })
        .lean();

      if (!doc) return ApiResponse.fail("Pago no encontrado", HttpStatus.NOT_FOUND, null);
      return ApiResponse.ok(doc, HttpStatus.OK, "OK");
    } catch (error) {
      Logger.error("PaymentServiceImpl.getById :: error", error);
      throw error;
    }
  }

  async updateById(id: string, data: UpdatePaymentDTO) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return ApiResponse.fail("ID inválido", HttpStatus.BAD_REQUEST, null);
      }

      const payload: any = { ...data };

      if (payload.items && Array.isArray(payload.items)) {
        payload.items = payload.items.map((it: any) => ({
          title: String(it.title || "Item"),
          quantity: Math.max(1, toNumber(it.quantity) || 1),
          unit_price: Math.max(0, toNumber(it.unit_price) || 0),
          currency_id: it.currency_id || CURRENCY,
        }));
      }

      const updated = await PaymentModel.findByIdAndUpdate(id, payload, {
        new: true,
      }).populate({ path: "user", select: "username email" });

      if (!updated) return ApiResponse.fail("Pago no encontrado", HttpStatus.NOT_FOUND, null);
      return ApiResponse.ok(updated, HttpStatus.OK, "Pago actualizado");
    } catch (error) {
      Logger.error("PaymentServiceImpl.updateById :: error", error);
      throw error;
    }
  }

  async confirmFromReturn(query: { payment_id?: string; preference_id?: string; status?: string }) {
    try {
      const paymentId = String(query?.payment_id || "");
      if (!paymentId) {
        return ApiResponse.fail("payment_id requerido", HttpStatus.BAD_REQUEST);
      }
      const paymentClient = new Payment(mpClient);
      const mp = await paymentClient.get({ id: paymentId });
      const resp = await this.persistFromMp(mp);
      return ApiResponse.ok(resp, HttpStatus.OK, "Confirmado");
    } catch (error) {
      Logger.error("PaymentServiceImpl.confirmFromReturn :: error", error);
      return ApiResponse.fail("Error confirmando pago", HttpStatus.INTERNAL_ERROR);
    }
  }

  async processWebhook(body: IWebhookPayload, query?: IWebhookQuery) {
    try {
      const topic = query?.topic || query?.type || (body as any)?.type;
      const paymentId =
        (query && (query["data.id"] as string)) ||
        (body as any)?.data?.id ||
        (body as any)?.id;

      Logger.info(`PaymentServiceImpl.processWebhook :: topic=${topic} paymentId=${paymentId}`);

      if (!paymentId) {
        return ApiResponse.ok({ received: true }, HttpStatus.OK, "Sin paymentId");
      }

      const paymentClient = new Payment(mpClient);
      const mp = await paymentClient.get({ id: paymentId });

      const resp = await this.persistFromMp(mp);
      // resp ya NO trae 'received'
      return ApiResponse.ok({ received: true, ...resp }, HttpStatus.OK, "OK");
    } catch (error) {
      Logger.error("PaymentServiceImpl.processWebhook :: error", error);
      return ApiResponse.ok({ received: true }, HttpStatus.OK, "Error procesando webhook");
    }
  }

  private async persistFromMp(mp: any) {
    const prefId =
      (mp as any)?.preference_id ||
      (mp as any)?.order?.id ||
      (mp as any)?.metadata?.preference_id;

    if (!prefId) {
      return { message: "Sin preference_id" };
    }

    const status = String((mp as any).status || "");
    const payerEmail = (mp as any)?.payer?.email || undefined;

    const updated = await PaymentModel.findOneAndUpdate(
      { preferenceId: String(prefId) },
      {
        paymentId: String((mp as any).id),
        status,
        payerEmail,
        fech_modif: new Date(),
        updatedBy: "system",
      },
      { new: true }
    ).lean();

    if (!updated) {
      return { message: "Payment no encontrado" };
    }

    if (status === "approved") {
      const { items, amount, currency_id, createdBy } = updated as any;

      await SaleModel.findOneAndUpdate(
        { preferenceId: String(prefId) },
        {
          $setOnInsert: {
            preferenceId: String(prefId),
            items,
            total: amount,
            currency_id,
            customerEmail: payerEmail,
            createdBy: createdBy ?? "SYSTEM",
            fech_creacion: new Date(),
          },
          $set: { fech_modif: new Date() },
        },
        { new: true, upsert: true }
      );

      await PurchaseModel.findOneAndUpdate(
        { preferenceId: String(prefId) },
        {
          $setOnInsert: {
            preferenceId: String(prefId),
            items,
            total: amount,
            currency_id,
            customerEmail: payerEmail,
            createdBy: createdBy ?? "SYSTEM",
            fech_creacion: new Date(),
          },
          $set: { fech_modif: new Date() },
        },
        { new: true, upsert: true }
      );
    }

    return { payment: updated, status };
  }
}
