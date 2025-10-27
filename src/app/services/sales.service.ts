import { SaleStatus } from '../enum/sales.status.js';
import { ApiResponse } from '../models/api-response.model.js';
import { ListSalesQuery, MetricsOverview, MetricsOverviewParams, MetricsTimeSeriesParams, MetricsTimeSeriesPoint, MySalesQuery, Paged, SafeSale } from '../types/sales.type.js';


export interface SaleService {
  listMySales(userId: string, query?: MySalesQuery): Promise<ApiResponse<Paged<SafeSale>>>;
  getMySale(id: string, userId: string): Promise<ApiResponse<SafeSale | null>>;

  listSales(query?: ListSalesQuery): Promise<ApiResponse<Paged<SafeSale>>>;
  getSale(id: string): Promise<ApiResponse<SafeSale | null>>;
  updateStatus(id: string, status: SaleStatus): Promise<ApiResponse<SafeSale | null>>;

  metricsOverview(params?: MetricsOverviewParams): Promise<ApiResponse<MetricsOverview>>;
  metricsTimeSeries(params?: MetricsTimeSeriesParams): Promise<ApiResponse<MetricsTimeSeriesPoint[]>>;
}
