import { NavbarRole, NavResponse } from '../interfaces/navbar.interface.js';

export interface NavService {
  getMenu(role: NavbarRole, isAuthenticated: boolean): NavResponse;
}


