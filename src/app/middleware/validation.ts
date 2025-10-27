import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../models/api-response.model.js";
import { HttpStatus } from "../enum/http.status.js";

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json(ApiResponse.fail("Validación fallida", HttpStatus.BAD_REQUEST, errors.array()));
  }
  next();
}