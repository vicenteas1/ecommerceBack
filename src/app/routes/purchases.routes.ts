import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateToken } from '../middleware/authorization.js';
import { requireBuyer } from '../middleware/checkRole.js';
import { validate } from '../middleware/validation.js';
import { PurchaseController } from '../controller/purchase.controller.js';
import { PurchaseServiceImpl } from '../services/impl/purchase.service.impl.js';
import { PaymentStatus } from '../enum/payment.status.js';
import { PaymentProvider } from '../enum/payment.provider.js';


const router = Router();
const purchaseService = new PurchaseServiceImpl();
const purchaseController = new PurchaseController(purchaseService);

router.get(
  '/myPurchases',
  validateToken,
  requireBuyer,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('paymentStatus')
    .optional()
    .isIn(Object.values(PaymentStatus))
    .withMessage(`Estado de pago inválido. Valores permitidos: ${Object.values(PaymentStatus).join(', ')}`),
  validate,
  purchaseController.listMyPurchases.bind(purchaseController)
);

router.get(
  '/getPurchase/:id',
  validateToken,
  requireBuyer,
  param('id').isMongoId(),
  validate,
  purchaseController.getMyPurchase.bind(purchaseController)
);

router.post(
  '/createPurchase',
  validateToken,
  requireBuyer,
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.itemId').isMongoId().withMessage('itemId inválido'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Cantidad mínima: 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Precio debe ser mayor o igual a 0'),
  body('paymentProvider')
    .isIn(Object.values(PaymentProvider))
    .withMessage(`Proveedor de pago inválido. Debe ser uno de: ${Object.values(PaymentProvider).join(', ')}`),
  validate,
  purchaseController.createPurchase.bind(purchaseController)
);

router.post(
  '/cancelPurchase/:id',
  validateToken,
  requireBuyer,
  param('id').isMongoId(),
  validate,
  purchaseController.cancelPurchase.bind(purchaseController)
);

export default router;
