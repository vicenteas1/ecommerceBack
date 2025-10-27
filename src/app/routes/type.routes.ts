import { Router } from 'express';
import { body, param } from 'express-validator';
import { TypeController } from '../controller/types.controller.js';
import { TypeServiceImpl } from '../services/impl/type.service.impl.js';
import { validateToken } from '../middleware/authorization.js';
import { requireAdmin } from '../middleware/checkRole.js';
import { validate } from '../middleware/validation.js';

const router = Router();
const controller = new TypeController(new TypeServiceImpl());

router.post(
  "/createType",
  validateToken,
  requireAdmin,
  body("nombre").isString().notEmpty().trim(),
  validate,
  (req, res) => controller.create(req, res)
);

router.get("/getTypes", (req, res) => controller.readAll(req, res));

router.get(
  "/getType/:id",
  param("id").isMongoId(),
  validate,
  (req, res) => controller.readOne(req, res)
);

router.patch(
  "/updateType/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  body("nombre").optional().isString().notEmpty().trim(),
  validate,
  (req, res) => controller.update(req, res)
);

router.delete(
  "/deleteType/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  validate,
  (req, res) => controller.delete(req, res)
);

export default router;
