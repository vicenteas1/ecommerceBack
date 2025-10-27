export const TYPES = ["producto", "servicio"] as const;
export type TypeName = typeof TYPES[number];

export default TYPES;

export type SafeType = {
  id: string;
  nombre: string;
  slug: string;
  fech_creacion?: Date | string;
  fech_modif?: Date | string;
  createdBy?: string;
  updatedBy?: string;
};

export type CreateTypeDTO = {
  nombre: string;
  createdBy: string;
};

export type UpdateTypeDTO = {
  nombre?: string;
  updatedBy?: string;
};
