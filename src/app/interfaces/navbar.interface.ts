import type { UserRole } from "@models/role.model.js";

export type NavbarRole = "guest" | UserRole;

export interface NavItem {
  menuname: string;
  route?: string;
  submenu?: NavItem[];
  roles?: NavbarRole[];
  requireAuth?: boolean;
  hideWhenAuthenticated?: boolean;
  order?: number;
  enabled?: boolean;
  displayMenuName?: boolean;
}

export interface NavResponse {
  role: NavbarRole;
  isAuthenticated: boolean;
  items: NavItem[];
}
