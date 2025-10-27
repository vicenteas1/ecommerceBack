import 'express';
import type { JwtPayloadUser } from '../interfaces/jwt-payload.interface.js';

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayloadUser;
  }
}
