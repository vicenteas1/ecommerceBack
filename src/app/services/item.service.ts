import { ApiResponse } from "../models/api-response.model.js";
import {
  CreateItemDTO,
  ListItemsQuery,
  Paged,
  SafeItem,
  UpdateItemDTO,
} from "../types/item.type.js";

export interface ItemService {
  create(data: CreateItemDTO): Promise<ApiResponse<SafeItem | null>>;
  list(query?: ListItemsQuery): Promise<ApiResponse<Paged<SafeItem>>>;
  getById(id: string): Promise<ApiResponse<SafeItem | null>>;
  updateById(id: string, update: UpdateItemDTO): Promise<ApiResponse<SafeItem | null>>;
  removeById(id: string): Promise<ApiResponse<{ deleted: boolean }>>;
  getDistinctCategories(): Promise<ApiResponse<string[]>>;
  getDistinctTypes(): Promise<ApiResponse<string[]>>;
}
