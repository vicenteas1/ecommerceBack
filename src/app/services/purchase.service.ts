import { ApiResponse } from '../models/api-response.model.js';
import { CreatePurchaseDTO, MyPurchasesQuery, Paged, SafePurchase } from '../types/purchase.type.js';

export interface PurchaseService {
  listMyPurchases(userId: string, query?: MyPurchasesQuery): Promise<ApiResponse<Paged<SafePurchase>>>;
  getMyPurchase(id: string, userId: string): Promise<ApiResponse<SafePurchase | null>>;
  createPurchase(data: CreatePurchaseDTO): Promise<ApiResponse<SafePurchase | null>>;
  cancelPurchase(id: string, userId: string): Promise<ApiResponse<{ cancelled: boolean }>>;
}
