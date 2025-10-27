import { SafeUser } from '../types/user.type';

export interface LoginResult {
  user: SafeUser;
  accessToken: string;
  refreshToken?: string;
}