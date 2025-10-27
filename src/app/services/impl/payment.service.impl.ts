import 'dotenv/config';
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { Types } from "mongoose";
import { Logger } from "../../config/logger.js";
import { ApiResponse } from "../../models/api-response.model.js";
import { HttpStatus } from "../../enum/http.status.js";
import { PaymentModel } from "../../models/payment.model.js";
import { PaymentService } from "../services/payment.service.js";
import {
  CreatePreferenceDTO,
  IWebhookPayload,
  IWebhookQuery,
  ListPaymentsFilter,
  UpdatePaymentDTO,
} from "interfaces/payment.interface.js";
import { randomUUID } from "crypto";

const { MP_ACCESS_TOKEN, FRONT_URL, BASE_URL } = process.env as Record<string, string>;

const CURRENCY = "CLP";
const toNumber = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const ensureUrl = (u?: string | null) => {
  if (!u || typeof u !== "string") return null;
  const trimmed = u.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
};

const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN || "",
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

      const front = ensureUrl(FRONT_URL);
      const base = ensureUrl(BASE_URL);

      if (!front) {
        Logger.error("FRONT_URL inválida o no definida");
        return ApiResponse.fail(
          "Config inválida: FRONT_URL no definida o inválida (debe incluir http/https)",
          HttpStatus.INTERNAL_ERROR
        );
      }

      if (!MP_ACCESS_TOKEN) {
        Logger.error("MP_ACCESS_TOKEN no definido");
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

      const backUrls = {
        success: `${front}/checkout/success`,
        failure: `${front}/checkout/failure`,
        pending: `${front}/checkout/pending`,
      };

      if (!/^https?:\/\//i.test(backUrls.success)) {
        Logger.error("back_urls.success inválida:", backUrls.success);
        return ApiResponse.fail("Config inválida: back_urls.success inválida", HttpStatus.INTERNAL_ERROR);
      }

      const prefClient = new Preference(mpClient);

      Logger.info("MP Preference.create :: back_urls=%j notification_url=%s", backUrls, base ? `${base}/api/payments/webhook` : "undefined");

      const resp = await prefClient.create({
        body: {
          items,
          payer: data.payer || undefined,
          back_urls: backUrls,
          auto_return: "approved",
          statement_descriptor: "PROSAAV",
          binary_mode: false,
          notification_url: base ? `${base}/api/payments/webhook` : undefined,
        },
      });

      const prefId = (resp as any)?.id ?? (resp as any)?.body?.id;
      const initPoint =
        (resp as any)?.sandbox_init_point ??
        (resp as any)?.init_point ??
        (resp as any)?.body?.init_point;

      if (!prefId || !initPoint) {
        Logger.error("Mercado Pago no retornó id o init_point", resp);
        return ApiResponse.fail("No se pudo crear la preferencia", HttpStatus.INTERNAL_ERROR);
      }

      const saved = await PaymentModel.create({
        items,
        amount,
        currency_id: items[0]?.currency_id || CURRENCY,
        preferenceId: String(prefId),
        status: "pending",
        payerEmail: data.payer?.email,
        createdBy: new Types.ObjectId(data.createdBy),
        updatedBy: new Types.ObjectId(data.createdBy),
      });

      return ApiResponse.ok(
        { id: String(prefId), init_point: initPoint, payment: saved.toJSON() },
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

      const updated = await PaymentModel.findByIdAndUpdate(id, payload, { new: true })
        .populate({ path: "user", select: "username email" });

      if (!updated) return ApiResponse.fail("Pago no encontrado", HttpStatus.NOT_FOUND, null);
      return ApiResponse.ok(updated, HttpStatus.OK, "Pago actualizado");
    } catch (error) {
      Logger.error("PaymentServiceImpl.updateById :: error", error);
      throw error;
    }
  }

  async processWebhook(body: IWebhookPayload, query?: IWebhookQuery) {
    try {
      const topic = query?.topic || query?.type || body?.type;
      const paymentId =
        (query && (query["data.id"] as string)) ||
        body?.data?.id ||
        (body as any)?.id;

      Logger.info(
        `PaymentServiceImpl.processWebhook :: topic=${topic} paymentId=${paymentId}`
      );

      if (!paymentId) {
        return ApiResponse.ok({ received: true }, HttpStatus.OK, "Sin paymentId");
      }

      const paymentClient = new Payment(mpClient);
      const mp = await paymentClient.get({ id: paymentId });

      const prefId =
        (mp as any)?.preference_id ||
        (mp as any)?.order?.id ||
        (mp as any)?.metadata?.preference_id;

      if (!prefId) {
        return ApiResponse.ok({ received: true }, HttpStatus.OK, "Sin preference_id");
      }

      const updated = await PaymentModel.findOneAndUpdate(
        { preferenceId: String(prefId) },
        {
          paymentId: String((mp as any).id),
          status: String((mp as any).status),
          payerEmail: (mp as any)?.payer?.email || undefined,
          updatedBy: "system",
        },
        { new: true }
      );

      if (!updated) {
        Logger.warn(`Payment no encontrado para preferenceId=${prefId}`);
        return ApiResponse.ok({ received: true }, HttpStatus.OK, "Payment no encontrado");
      }

      return ApiResponse.ok({ received: true, payment: updated }, HttpStatus.OK, "OK");
    } catch (error) {
      Logger.error("PaymentServiceImpl.processWebhook :: error", error);
      return ApiResponse.ok({ received: true }, HttpStatus.OK, "Error procesando webhook");
    }
  }
}
