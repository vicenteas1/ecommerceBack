export const ROLES = ["buyer", "admin", "guest"] as const;
export type UserRole = typeof ROLES[number];

export class RoleClass {
  private constructor(public readonly value: UserRole) {}

  static readonly BUYER = new RoleClass("buyer");
  static readonly ADMIN = new RoleClass("admin");
  static readonly GUEST = new RoleClass("guest");

  static values(): readonly UserRole[] {
    return ROLES;
  }

  static isValid(v: unknown): v is UserRole {
    return typeof v === "string" && (ROLES as readonly string[]).includes(v);
  }

  static from(v: unknown): RoleClass {
    if (v instanceof RoleClass) return v;
    if (this.isValid(v)) {
      switch (v) {
        case "buyer": return this.BUYER;
        case "admin": return this.ADMIN;
        case "guest": return this.GUEST;
      }
    }
    throw new Error(`Rol inválido: ${v}`);
  }

  equals(other: RoleClass | string): boolean {
    return this.value === (other instanceof RoleClass ? other.value : other);
  }

  toString(): string { return this.value; }
  toJSON(): string { return this.value; }
}
