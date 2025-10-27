import { Types } from 'mongoose';
import { ApiResponse } from '../../models/api-response.model.js';
import { PurchaseModel, type PurchaseClass } from '../../models/purchase.model.js';
import {
    SafePurchase,
    SafePurchaseItem,
    Paged,
    MyPurchasesQuery,
} from '../../types/purchase.type.js';

import { PaymentStatus } from '../../enum/payment.status.js';
import { Logger } from '../../config/logger.js';
import { CreatePurchaseDTO } from '../../types/purchase.type.js';
import { PurchaseService } from '../purchase.service.js';
import { HttpStatus } from 'enum/http.status.js';

export class PurchaseServiceImpl implements PurchaseService {
  async listMyPurchases(userId: string, query?: MyPurchasesQuery): Promise<ApiResponse<Paged<SafePurchase>>> {
    try {
      if (!Types.ObjectId.isValid(userId)) return ApiResponse.fail('userId inválido', HttpStatus.BAD_REQUEST);

      const page = Math.max(1, Number(query?.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(query?.limit ?? 10)));
      const skip = (page - 1) * limit;

      const filter: any = { userId: new Types.ObjectId(userId) };
      if (query?.paymentStatus) filter.paymentStatus = query.paymentStatus;

      const [raw, total] = await Promise.all([
        PurchaseModel.find(filter).sort({ fech_creacion: -1 }).skip(skip).limit(limit).lean(),
        PurchaseModel.countDocuments(filter),
      ]);

      const items = raw.map((p) => this.toSafe(p as unknown as PurchaseClass));
      return ApiResponse.ok<Paged<SafePurchase>>({ items, total, page, limit }, HttpStatus.OK, 'OK');
    } catch (err: any) {
      Logger.error(`PurchaseService.listMyPurchases error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudieron obtener tus compras', HttpStatus.INTERNAL_ERROR) as unknown as ApiResponse<Paged<SafePurchase>>;
    }
  }

  async getMyPurchase(id: string, userId: string): Promise<ApiResponse<SafePurchase | null>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail('ID inválido', HttpStatus.BAD_REQUEST);
      if (!Types.ObjectId.isValid(userId)) return ApiResponse.fail('userId inválido', HttpStatus.BAD_REQUEST);

      const purchase = await PurchaseModel.findOne({ _id: id, userId }).lean();
      if (!purchase) return ApiResponse.fail('Compra no encontrada', HttpStatus.NOT_FOUND);

      return ApiResponse.ok<SafePurchase>(this.toSafe(purchase as unknown as PurchaseClass), HttpStatus.OK, 'OK');
    } catch (err: any) {
      Logger.error(`PurchaseService.getMyPurchase error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'NOK', HttpStatus.INTERNAL_ERROR);
    }
  }

  async createPurchase(data: CreatePurchaseDTO): Promise<ApiResponse<SafePurchase | null>> {
    try {
      if (!Types.ObjectId.isValid(data.userId)) return ApiResponse.fail('userId inválido', HttpStatus.BAD_REQUEST);
      if (!data.items?.length) return ApiResponse.fail('Debe incluir al menos un producto', HttpStatus.BAD_REQUEST);

      const items = data.items.map((it) => {
        const itemIdOk = Types.ObjectId.isValid(it.itemId);
        const qtyOk = Number(it.qty) >= 1;
        const priceNum = Number(it.price);
        if (!itemIdOk || !qtyOk || Number.isNaN(priceNum) || priceNum < 0) {
          throw new Error('Item inválido en la compra');
        }
        return {
          itemId: new Types.ObjectId(it.itemId),
          name: it.name ?? '',
          price: priceNum,
          qty: Number(it.qty),
        };
      });

      const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
      const total = subtotal;

      const saved = await PurchaseModel.create({
        userId: new Types.ObjectId(data.userId),
        items,
        subtotal,
        total,
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: data.paymentProvider,
      });

      return ApiResponse.ok<SafePurchase>(this.toSafe(saved as PurchaseClass), HttpStatus.CREATED, 'Compra creada');
    } catch (err: any) {
      Logger.error(`PurchaseService.createPurchase error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'No se pudo crear la compra', HttpStatus.BAD_REQUEST);
    }
  }

  async cancelPurchase(id: string, userId: string): Promise<ApiResponse<{ cancelled: boolean }>> {
    try {
      if (!Types.ObjectId.isValid(id)) return ApiResponse.fail('ID inválido', HttpStatus.BAD_REQUEST);
      if (!Types.ObjectId.isValid(userId)) return ApiResponse.fail('userId inválido', HttpStatus.BAD_REQUEST);

      const purchase = await PurchaseModel.findOne({ _id: id, userId }).select('paymentStatus').lean();
      if (!purchase) return ApiResponse.fail('Compra no encontrada', HttpStatus.NOT_FOUND);

      if (purchase.paymentStatus !== PaymentStatus.PENDING) {
        return ApiResponse.fail('La compra no se puede cancelar en este estado', HttpStatus.BAD_REQUEST);
      }

      await PurchaseModel.updateOne(
        { _id: id, userId },
        { $set: { paymentStatus: PaymentStatus.FAILED, notes: 'Cancelada por el usuario' } }
      );

      return ApiResponse.ok({ cancelled: true }, HttpStatus.OK, 'Compra cancelada');
    } catch (err: any) {
      Logger.error(`PurchaseService.cancelPurchase error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudo cancelar la compra', HttpStatus.INTERNAL_ERROR);
    }
  }

  private toSafe(p: PurchaseClass): SafePurchase {
    const items: SafePurchaseItem[] =
      ((p as any).items ?? []).map((it: any) => ({
        itemId: it.itemId?.toString?.() ?? String(it.itemId),
        name: it.name,
        price: it.price,
        qty: it.qty,
      })) ?? [];

    return {
      id: (p as any).id ?? (p as any)._id?.toString(),
      userId: (p as any).userId?.toString?.() ?? String((p as any).userId),
      items,
      subtotal: (p as any).subtotal,
      total: (p as any).total,
      paymentStatus: (p as any).paymentStatus,
      paymentProvider: (p as any).paymentProvider,
      fech_creacion: (p as any).fech_creacion,
      fech_modif: (p as any).fech_modif,
      notes: (p as any).notes,
    };
  }
}
