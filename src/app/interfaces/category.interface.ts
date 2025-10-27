import { Types } from 'mongoose';

export interface ICategory {
  id?: string;
  nombre: string;
  slug?: string;
  type: Types.ObjectId | string;
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  fech_creacion?: Date;
  fech_modif?: Date;
}

export interface ICategoryService {
  create(data: Partial<ICategory>): Promise<any>;
  list(filter?: { typeId?: string | Types.ObjectId; typeSlug?: string }): Promise<any>;
  getById(id: string): Promise<any>;
  updateById(id: string, data: Partial<ICategory>): Promise<any>;
  removeById(id: string): Promise<any>;
  getDistinctByType(filter?: { typeId?: string | Types.ObjectId; typeSlug?: string }): Promise<any>;
}
