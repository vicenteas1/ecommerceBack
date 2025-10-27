import { Schema, model, Document } from "mongoose";

class NavItemClass extends Document {
  menuname!: string;
  route?: string;
  submenu?: NavItemClass[];
  roles?: string[];
  requireAuth?: boolean;
  hideWhenAuthenticated?: boolean;
  order?: number;
  enabled?: boolean;
}

const navItemSchema = new Schema<NavItemClass>(
  {
    menuname: { type: String, required: true, trim: true },
    route: { type: String },
    submenu: { type: [Object], default: [] },
    roles: { type: [String], default: [] },
    requireAuth: { type: Boolean, default: false },
    hideWhenAuthenticated: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const navbarSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    items: { type: [navItemSchema], default: [] },
  },
  { timestamps: true }
);

export const NavbarModel = model("Navbar", navbarSchema);
