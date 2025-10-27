import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/role.model.js';
import { HttpStatus } from '../enum/http.status.js';
import jwt from 'jsonwebtoken';

export const requireRole =
  (...allowed: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user?.role) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ code: HttpStatus.UNAUTHORIZED, message: "No autenticado", data: null });
    }
    if (!allowed.includes(user.role as UserRole)) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ code: HttpStatus.FORBIDDEN, message: `No autorizado: se requiere rol ${allowed.join(" o ")}`, data: null });
    }
    return next();
  };

export const requireAdmin = requireRole("admin");
export const requireBuyer  = requireRole("buyer", "admin");

export function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.user;
  const targetId = req.params.id;
  if (!auth) return res.status(HttpStatus.UNAUTHORIZED).json({ code: HttpStatus.UNAUTHORIZED, message: "No autenticado", data: null });
  if (auth.role === "admin" || auth.id === targetId) return next();
  return res.status(HttpStatus.FORBIDDEN).json({ code: HttpStatus.FORBIDDEN, message: "No autorizado", data: null });
}


export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth) return next();

  const [type, token] = auth.split(" ");

  if (type !== "Bearer" || !token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const claims = payload?.user;

    if (claims?.id) {
      (req as any).user = {
        id: claims.id,
        email: claims.email,
        role: claims.role,
      };
    }
  } catch (err) {
    console.warn("Token inválido o expirado (optionalAuth):", err);
  }

  next();
}