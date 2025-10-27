import { UserRole } from '../models/role.model.js';
import { UserClass } from '../models/user.model.js';
import { AuthUser } from '../interfaces/user.interface.js';

export type SafeUser = Pick<
  UserClass,
  "id" | "username" | "email" | "role" | "fech_creacion" | "fech_modif"
>;

export type CreateUserDTO = Pick<AuthUser, "username" | "email" | "password"> & {
  role?: UserRole;
  createdBy: string;
};

export type LoginDTO = Pick<AuthUser, "email" | "password">;

export type UpdateUserDTO = {
  username?: string;
  email?: string;
  role?: UserRole;
  updatedBy?: string;
};

export type ChangePasswordDTO = {
  oldPassword: string;
  newPassword: string;
};

export type ListUsersQuery = {
  q?: string;
  page?: number;
  limit?: number;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
