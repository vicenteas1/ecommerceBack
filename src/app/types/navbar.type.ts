import { NavItem } from "../interfaces/navbar.interface";

export const BASE_MENU: NavItem[] = [
  {
    menuname: "Gestion",
    displayMenuName: true,
    roles: ["admin"],
    submenu: [
      { menuname: "Usuarios",  route: "/gestion/usuarios"  },
      { menuname: "Items",     route: "/gestion/items"     },
      { menuname: "Ventas",    route: "/gestion/ventas"    },
      { menuname: "Categorías", route: "/gestion/categorias" },
      { menuname: "Tipos",     route: "/gestion/tipos"     },
    ],
  },
  {
    menuname: "Servicios",
    displayMenuName: true,
    submenu: [
      { menuname: "Construcción", route: "/servicio?tipo=servicio&categoria=construccion" },
      { menuname: "Asesoría",     route: "/servicio?tipo=servicio&categoria=asesoria" },
      { menuname: "Inspección",   route: "/servicio?tipo=servicio&categoria=inspeccion" },
      { menuname: "Pericia",      route: "/servicio?tipo=servicio&categoria=pericia" },
    ],
  },
  {
    menuname: "Sobre Nosotros",
    displayMenuName: true,
    submenu: [
      { menuname: "Quienes Somos",      route: "/servicio/quienes-somos" },
      { menuname: "Nuestros Proyectos", route: "/servicio/nuestros-proyectos" },
      { menuname: "Misión / Visión",    route: "/servicio/mision-vision" },
    ],
  },
  { menuname: "Contacto",       route: "/contacto", displayMenuName:  true   },
  { menuname: "Perfil",         route: "/perfil",   displayMenuName:  true,  requireAuth: true },
  { menuname: "Iniciar Sesión", route: "/login",    displayMenuName:  true,  hideWhenAuthenticated: true },
  { menuname: "Cerrar Sesión",  route: "/logout",   displayMenuName:  true,  requireAuth: true },
  { menuname: "Carrito",        route: "/cart",    displayMenuName:  false, requireAuth: true },
];