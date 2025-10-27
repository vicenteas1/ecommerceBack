import { ICategory } from "../interfaces/category.interface";
import { Types } from "mongoose";

export interface ICategoryService {
  create(data: Partial<ICategory>): Promise<any>;
  list(filter?: { typeId?: string | Types.ObjectId; typeSlug?: string }): Promise<any>;
  getById(id: string): Promise<any>;
  updateById(id: string, data: Partial<ICategory>): Promise<any>;
  removeById(id: string): Promise<any>;
  getDistinctByType(filter?: { typeId?: string | Types.ObjectId; typeSlug?: string }): Promise<any>;
}