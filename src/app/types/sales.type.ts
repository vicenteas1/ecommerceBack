import { PaymentStatus } from "../enum/payment.status";
import { SaleStatus } from "../enum/sales.status";

export type SafeSaleItem = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
};

export type SafeSale = {
  id: string;
  userId: string;
  items: SafeSaleItem[];
  subtotal: number;
  taxes: number;
  total: number;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: string;
  checkoutSessionId?: string;
  notes?: string;
  fech_creacion: Date;
  fech_modif: Date;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type MySalesQuery = {
  page?: number;
  limit?: number;
};

export type ListSalesQuery = {
  from?: string;
  to?: string;
  status?: SaleStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  page?: number;
  limit?: number;
};

export type MetricsOverviewParams = {
  from?: string;
  to?: string;
};
export type MetricsOverview = {
  ordersCount: number;
  totalRevenue: number;
  paidOrders: number;
  avgOrder: number;
};

export type MetricsTimeSeriesParams = {
  from?: string;
  to?: string;
  interval?: "day" | "week" | "month";
};
export type MetricsTimeSeriesPoint = {
  bucket: string;
  revenue: number;
  count: number;
};
