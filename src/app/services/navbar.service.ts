import { NavbarRole, NavResponse } from '../interfaces/navbar.interface';

export interface NavService {
  getMenu(role: NavbarRole, isAuthenticated: boolean): NavResponse;
}


