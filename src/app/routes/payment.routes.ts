import { Router } from 'express';
import { PaymentsController } from '../controller/payment.controller.js';
import { PaymentServiceImpl } from '../services/impl/payment.service.impl.js';
import { validateToken } from '../middleware/authorization.js';

const router = Router();
const controller = new PaymentsController(new PaymentServiceImpl());

router.post("/create-preference", validateToken, controller.createPreference.bind(controller));
router.get("/", controller.findAll.bind(controller));
router.get("/:id", controller.findById.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.post("/webhook", controller.webhook.bind(controller));

export default router;
