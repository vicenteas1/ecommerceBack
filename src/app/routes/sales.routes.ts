import { Router } from "express";
import { body, param, query } from "express-validator";
import { validateToken } from "../middleware/authorization.js";
import { requireAdmin, requireBuyer } from "../middleware/checkRole.js";
import { validate } from "../middleware/validation.js";
import { SaleController } from "../controller/sales.controller.js";
import { SaleServiceImpl } from "../services/impl/sales.service.impl.js";
import { SaleStatus } from "../enum/sales.status.js";
import { PaymentStatus } from "../enum/payment.status.js";

const router = Router();

const saleService = new SaleServiceImpl();
const saleController = new SaleController(saleService);

router.get(
  "/mySales",
  validateToken,
  requireBuyer,
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate,
  saleController.listMySales.bind(saleController)
);

router.get(
  "/getMySale/:id",
  validateToken,
  requireBuyer,
  param("id").isMongoId(),
  validate,
  saleController.getMySale.bind(saleController)
);

router.get(
  "/listSales",
  validateToken,
  requireAdmin,
  query("from").optional().isISO8601().withMessage("from debe ser fecha ISO"),
  query("to").optional().isISO8601().withMessage("to debe ser fecha ISO"),
  query("status").optional().isIn(Object.values(SaleStatus)).withMessage("status inválido"),
  query("paymentStatus").optional().isIn(Object.values(PaymentStatus)).withMessage("paymentStatus inválido"),
  query("q").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate,
  saleController.listSales.bind(saleController)
);

router.get(
  "/getSale/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  validate,
  saleController.getSale.bind(saleController)
);

router.patch(
  "/updateSaleStatus/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  body("status")
    .isIn(Object.values(SaleStatus))
    .withMessage(`Estado inválido. Debe ser uno de: ${Object.values(SaleStatus).join(", ")}`),
  validate,
  saleController.updateStatus.bind(saleController)
);

router.get(
  "/metrics/overview",
  validateToken,
  requireAdmin,
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  validate,
  saleController.metricsOverview.bind(saleController)
);

router.get(
  "/metrics/timeseries",
  validateToken,
  requireAdmin,
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  query("interval").optional().isIn(["day", "week", "month"]).default("day"),
  validate,
  saleController.metricsTimeSeries.bind(saleController)
);

export default router;
