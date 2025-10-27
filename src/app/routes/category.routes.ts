import { Router } from "express";
import { body, param, query } from "express-validator";

import { CategoryService } from "../services/impl/category.service.impl.js";
import { CategoryController } from "../controller/category.controller.js";

import { validateToken } from "../middleware/authorization.js";
import { requireAdmin } from "../middleware/checkRole.js";
import { validate } from "../middleware/validation.js";

const router = Router();
const controller = new CategoryController(new CategoryService());

router.post(
  "/createCategory",
  validateToken,
  requireAdmin,
  body("nombre").isString().notEmpty().trim(),
  body("typeId").isMongoId(),
  validate,
  (req, res) => controller.create(req, res)
);

router.get(
  "/getCategories",
  query("typeId").optional().isMongoId(),
  query("typeSlug").optional().isString().trim(),
  validate,
  (req, res) => controller.readAll(req, res)
);

router.get(
  "/getCategory/:id",
  param("id").isMongoId(),
  validate,
  (req, res) => controller.readOne(req, res)
);

router.patch(
  "/updateCategory/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  body("nombre").optional().isString().notEmpty().trim(),
  body("typeId").optional().isMongoId(),
  validate,
  (req, res) => controller.update(req, res)
);

router.delete(
  "/deleteCategory/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  validate,
  (req, res) => controller.delete(req, res)
);

router.get(
  "/getCategoriesByType",
  query("typeId").optional().isMongoId(),
  query("typeSlug").optional().isString().trim(),
  validate,
  (req, res) => controller.distinctByType(req, res)
);

export default router;
