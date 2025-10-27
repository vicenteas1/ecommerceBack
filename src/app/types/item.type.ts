import { ItemClass } from '../models/item.model.js';

export type SafeItem = Pick<
  ItemClass,
  | "id"
  | "nombre"
  | "descripcion"
  | "precio"
  | "type"
  | "category"
  | "fech_creacion"
  | "fech_modif"
> & {
  createdBy?: string;
  updatedBy?: string;
};

export type CreateItemDTO = {
  nombre: string;
  descripcion: string;
  precio: number;
  type: string;
  category: string;
  createdBy: string;
};

export type UpdateItemDTO = {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  type?: string;
  category?: string;
  updatedBy?: string;
};

export type ListItemsQuery = {
  q?: string;
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
