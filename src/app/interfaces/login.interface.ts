import { SafeUser } from "./user.interface.js";

export interface LoginResult {
  user: SafeUser;
  accessToken: string;
  refreshToken?: string;
}