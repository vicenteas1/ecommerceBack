import { PaymentProvider } from '../enum/payment.provider.js';
import { PaymentStatus } from '../enum/payment.status.js';

export type SafePurchaseItem = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
};

export type SafePurchase = {
  id: string;
  userId: string;
  items: SafePurchaseItem[];
  subtotal: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider | string;
  fech_creacion: Date;
  fech_modif: Date;
  notes?: string;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type CreatePurchaseItemDTO = {
  itemId: string;
  qty: number;
  price: number;
  name?: string;
};

export type CreatePurchaseDTO = {
  userId: string;
  items: CreatePurchaseItemDTO[];
  paymentProvider: PaymentProvider;
};

export type MyPurchasesQuery = {
  page?: number;
  limit?: number;
  paymentStatus?: PaymentStatus;
};
