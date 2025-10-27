import { BASE_MENU } from '../../types/navbar.type.js';
import { NavbarRole, NavItem, NavResponse } from '../../interfaces/navbar.interface.js';
import { NavService } from '../../services/navbar.service.js';

export class NavServiceImpl implements NavService {
  getMenu(role: NavbarRole, isAuthenticated: boolean): NavResponse {
    const filtered = this.filterMenu(BASE_MENU, role, isAuthenticated);
    return { role, isAuthenticated, items: filtered };
  }

  private filterMenu(items: NavItem[], role: NavbarRole, isAuth: boolean): NavItem[] {
    return items
      .filter((it) => it.enabled !== false)
      .filter((it) => {
        if (it.roles && it.roles.length > 0 && !it.roles.includes(role)) return false;
        if (it.requireAuth && !isAuth) return false;
        if (it.hideWhenAuthenticated && isAuth) return false;
        return true;
      })
      .map((it) => {
        const child = it.submenu?.length ? this.filterMenu(it.submenu, role, isAuth) : [];
        return { ...it, submenu: child };
      })
      .filter((it) => {
        if (!it.route && (!it.submenu || it.submenu.length === 0)) return false;
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}