import { ApiResponse } from '../models/api-response.model.js';
import { CreateTypeDTO, SafeType, UpdateTypeDTO } from '../types/type.type.js';

export interface TypeService {
  create(data: CreateTypeDTO): Promise<ApiResponse<SafeType | null>>;
  list(): Promise<ApiResponse<SafeType[]>>;
  getById(id: string): Promise<ApiResponse<SafeType | null>>;
  updateById(id: string, update: UpdateTypeDTO): Promise<ApiResponse<SafeType | null>>;
  removeById(id: string): Promise<ApiResponse<{ deleted: boolean }>>;
}
