import { ApiResponse } from '../models/api-response.model.js';
import { JwtPayloadUser } from '../interfaces/user.interface.js';
import { LoginResult } from '../interfaces/login.interface.js';
import { CreateUserDTO, ListUsersQuery, LoginDTO, Paged, SafeUser, UpdateUserDTO } from '../types/user.type.js';


export interface UserService {
  create(data: CreateUserDTO): Promise<ApiResponse<SafeUser | null>>;
  login(data: LoginDTO): Promise<ApiResponse<LoginResult | null>>;
  verifyToken(user: JwtPayloadUser, refresh: boolean): Promise<
    ApiResponse<{ valid: boolean; user: JwtPayloadUser; token?: string }>
  >;
  updateById(id: string, update: UpdateUserDTO): Promise<ApiResponse<SafeUser | null> | null>;
  getById(id: string): Promise<ApiResponse<SafeUser | null> | null>;
  list(query?: ListUsersQuery): Promise<ApiResponse<Paged<SafeUser>>>;
  removeById(id: string): Promise<ApiResponse<{ deleted: boolean }>>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<
    ApiResponse<{ changed: boolean }>
  >;
}
