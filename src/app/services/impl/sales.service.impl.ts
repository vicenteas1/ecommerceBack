import { SaleClass, SaleModel } from '../../models/sales.model.js';
import { ApiResponse } from '../../models/api-response.model.js';
import { ListSalesQuery, MetricsOverview, MetricsOverviewParams, MetricsTimeSeriesParams, MetricsTimeSeriesPoint, MySalesQuery, Paged, SafeSale, SafeSaleItem } from '../../types/sales.type.js';
import { SaleService } from '../sales.service.js';
import { Types } from 'mongoose';
import { Logger } from '../../config/logger.js';
import { SaleStatus } from '../../enum/sales.status.js';
import { PaymentStatus } from '../../enum/payment.status.js';

export class SaleServiceImpl implements SaleService {
  /* =============================== BUYER =============================== */

  async listMySales(userId: string, query?: MySalesQuery): Promise<ApiResponse<Paged<SafeSale>>> {
    try {
      if (!Types.ObjectId.isValid(userId)) return ApiResponse.fail('userId inválido', 400);

      const page = Math.max(1, Number(query?.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(query?.limit ?? 10)));
      const skip = (page - 1) * limit;

      const filter = { userId: new Types.ObjectId(userId) };

      const [raw, total] = await Promise.all([
        SaleModel.find(filter).sort({ fech_creacion: -1 }).skip(skip).limit(limit).lean(),
        SaleModel.countDocuments(filter),
      ]);

      const items = raw.map((s) => this.toSafe(s as unknown as SaleClass));
      return ApiResponse.ok<Paged<SafeSale>>({ items, total, page, limit }, 200, 'OK');
    } catch (err: any) {
      Logger.error(`SaleService.listMySales error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudieron obtener tus compras', 500) as unknown as ApiResponse<Paged<SafeSale>>;
    }
  }

  async getMySale(id: string, userId: string): Promise<ApiResponse<SafeSale | null>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail('ID inválido', 400);
      if (!Types.ObjectId.isValid(userId)) return ApiResponse.fail('userId inválido', 400);

      const sale = await SaleModel.findOne({ _id: id, userId }).lean();
      if (!sale) return ApiResponse.fail('Venta no encontrada', 404);

      return ApiResponse.ok<SafeSale>(this.toSafe(sale as unknown as SaleClass), 200, 'OK');
    } catch (err: any) {
      Logger.error(`SaleService.getMySale error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'NOK', 500);
    }
  }

  /* =============================== ADMIN =============================== */

  async listSales(query?: ListSalesQuery): Promise<ApiResponse<Paged<SafeSale>>> {
    try {
      const page = Math.max(1, Number(query?.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(query?.limit ?? 20)));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (query?.from || query?.to) {
        filter.fech_creacion = {};
        if (query.from) filter.fech_creacion.$gte = new Date(query.from);
        if (query.to)   filter.fech_creacion.$lte = new Date(query.to);
      }
      if (query?.status) filter.status = query.status;
      if (query?.paymentStatus) filter.paymentStatus = query.paymentStatus;

      const [raw, total] = await Promise.all([
        SaleModel.find(filter).sort({ fech_creacion: -1 }).skip(skip).limit(limit).lean(),
        SaleModel.countDocuments(filter),
      ]);

      const items = raw.map((s) => this.toSafe(s as unknown as SaleClass));
      return ApiResponse.ok<Paged<SafeSale>>({ items, total, page, limit }, 200, 'OK');
    } catch (err: any) {
      Logger.error(`SaleService.listSales error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudieron listar ventas', 500) as unknown as ApiResponse<Paged<SafeSale>>;
    }
  }

  async getSale(id: string): Promise<ApiResponse<SafeSale | null>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail('ID inválido', 400);
      const sale = await SaleModel.findById(id).lean();
      if (!sale) return ApiResponse.fail('Venta no encontrada', 404);
      return ApiResponse.ok<SafeSale>(this.toSafe(sale as unknown as SaleClass), 200, 'OK');
    } catch (err: any) {
      Logger.error(`SaleService.getSale error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'NOK', 500);
    }
  }

  async updateStatus(id: string, status: SaleStatus): Promise<ApiResponse<SafeSale | null>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail('ID inválido', 400);
      if (!Object.values(SaleStatus).includes(status)) return ApiResponse.fail('status inválido', 400);

      const updated = await SaleModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      ).lean();

      if (!updated) return ApiResponse.fail('Venta no encontrada', 404);
      return ApiResponse.ok<SafeSale>(this.toSafe(updated as unknown as SaleClass), 200, 'Estado actualizado');
    } catch (err: any) {
      Logger.error(`SaleService.updateStatus error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudo actualizar el estado', 500);
    }
  }

  /* =============================== MÉTRICAS =============================== */

  async metricsOverview(params?: MetricsOverviewParams): Promise<ApiResponse<MetricsOverview>> {
    try {
      const match: any = {};
      if (params?.from || params?.to) {
        match.fech_creacion = {};
        if (params.from) match.fech_creacion.$gte = new Date(params.from);
        if (params.to)   match.fech_creacion.$lte = new Date(params.to);
      }

      const [r] = await SaleModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            ordersCount: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            paidOrders: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PAID] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            ordersCount: 1,
            totalRevenue: 1,
            paidOrders: 1,
            avgOrder: {
              $cond: [{ $gt: ['$ordersCount', 0] }, { $divide: ['$totalRevenue', '$ordersCount'] }, 0],
            },
          },
        },
      ]);

      const overview: MetricsOverview = r ?? {
        ordersCount: 0,
        totalRevenue: 0,
        paidOrders: 0,
        avgOrder: 0,
      };

      return ApiResponse.ok<MetricsOverview>(overview, 200, 'OK');
    } catch (err: any) {
      Logger.error(`SaleService.metricsOverview error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudieron obtener métricas', 500) as unknown as ApiResponse<MetricsOverview>;
    }
  }

  async metricsTimeSeries(params?: MetricsTimeSeriesParams): Promise<ApiResponse<MetricsTimeSeriesPoint[]>> {
    try {
      const match: any = {};
      if (params?.from || params?.to) {
        match.fech_creacion = {};
        if (params.from) match.fech_creacion.$gte = new Date(params.from);
        if (params.to)   match.fech_creacion.$lte = new Date(params.to);
      }

      const interval = params?.interval ?? 'day';
      const fmt =
        interval === 'week'
          ? '%G-%V'
          : interval === 'month'
          ? '%Y-%m'
          : '%Y-%m-%d';

      const series = await SaleModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: fmt, date: '$fech_creacion' } },
            revenue: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            bucket: '$_id',
            revenue: 1,
            count: 1,
          },
        },
      ]);

      return ApiResponse.ok<MetricsTimeSeriesPoint[]>(series, 200, 'OK');
    } catch (err: any) {
      Logger.error(`SaleService.metricsTimeSeries error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudo obtener la serie temporal', 500) as unknown as ApiResponse<MetricsTimeSeriesPoint[]>;
    }
  }

  /* =============================== HELPERS =============================== */

  private toSafe(s: SaleClass): SafeSale {
    const items: SafeSaleItem[] = (s as any).items?.map((it: any) => ({
      itemId: it.itemId?.toString?.() ?? String(it.itemId),
      name: it.name,
      price: it.price,
      qty: it.qty,
    })) ?? [];

    return {
      id: (s as any).id ?? (s as any)._id?.toString(),
      userId: (s as any).userId?.toString?.() ?? String((s as any).userId),
      items,
      subtotal: (s as any).subtotal,
      taxes: (s as any).taxes,
      total: (s as any).total,
      status: (s as any).status,
      paymentStatus: (s as any).paymentStatus,
      paymentProvider: (s as any).paymentProvider,
      checkoutSessionId: (s as any).checkoutSessionId,
      notes: (s as any).notes,
      fech_creacion: (s as any).fech_creacion,
      fech_modif: (s as any).fech_modif,
    };
  }
}
