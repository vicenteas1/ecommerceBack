import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateToken } from '../middleware/authorization.js';
import { requireAdmin } from '../middleware/checkRole.js';
import { validate } from '../middleware/validation.js';
import { ItemServiceImpl } from '../services/impl/item.service.impl.js';
import { ItemController } from '../controller/item.controller.js';

const router = Router();
const itemService = new ItemServiceImpl();
const itemController = new ItemController(itemService);

const norm = (v: any) => (typeof v === "string" ? v.trim() : v);

router.post(
  "/createItem",
  validateToken,
  requireAdmin,
  body("nombre").isString().trim().notEmpty(),
  body("descripcion").isString().trim().notEmpty(),
  body("precio").isNumeric().toFloat().isFloat({ min: 0 }),
  body("type").isMongoId(),
  body("category").isMongoId(),
  body("stock").optional().isInt({ min: 0 }).toInt(),
  validate,
  itemController.create.bind(itemController)
);

router.get(
  "/getItems",
  query("q").optional().isString().trim().customSanitizer(norm),
  query("type").optional().isMongoId(),
  query("category").optional().isMongoId(),
  query("page").optional().isInt({ min: 1 }).toInt().default(1),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt().default(10),
  validate,
  itemController.findAll.bind(itemController)
);

router.get(
  "/getItem/:id",
  param("id").isMongoId(),
  validate,
  itemController.findById.bind(itemController)
);

router.put(
  "/updateItem/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  body("nombre").optional().isString().trim().notEmpty(),
  body("descripcion").optional().isString().trim().notEmpty(),
  body("precio").optional().isNumeric().toFloat().isFloat({ min: 0 }),
  body("type").optional().isMongoId(),
  body("category").optional().isMongoId(),
  body("stock").optional().isInt({ min: 0 }).toInt(),
  validate,
  itemController.update.bind(itemController)
);

router.delete(
  "/deleteItem/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  validate,
  itemController.delete.bind(itemController)
);

router.get("/categories", itemController.distinctCategories?.bind(itemController));
router.get("/types", itemController.distinctTypes?.bind(itemController));

export default router;
