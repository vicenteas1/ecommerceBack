export type SafeCategory = {
  id: string;
  nombre: string;
  slug: string;
  type: string;
  fech_creacion?: Date | string;
  fech_modif?: Date | string;
  createdBy?: string;
  updatedBy?: string;
};

export type CreateCategoryDTO = {
  nombre: string;
  type: string;
  createdBy: string;
};

export type UpdateCategoryDTO = {
  nombre?: string;
  type?: string;
  updatedBy?: string;
};
