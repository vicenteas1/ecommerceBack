import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../models/api-response.model.js';

export function validateToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res
      .status(401)
      .json(new ApiResponse(401, "Acceso no autorizado", null));
  }

  const [type, token] = auth?.split(" ");

  if (type !== 'Bearer') {
    return res
      .status(401)
      .json(new ApiResponse(401, "Acceso no autorizado", null));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const claims = payload?.user;
    if (!claims?.id) {
      return res.status(401).json(new ApiResponse(401, "Token inválido", null));
    }

    (req as any).user = { id: claims.id, email: claims.email, role: claims.role };
    next();
  } catch {
    return res.status(401).json(new ApiResponse(401, "Token inválido o expirado", null));
  }
}
