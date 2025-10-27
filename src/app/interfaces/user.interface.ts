import { UserRole } from '../models/role.model';

export interface AuthUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface JwtPayloadUser {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
}