import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { validateToken } from '../middleware/authorization.js';
import { requireAdmin, requireSelfOrAdmin } from '../middleware/checkRole.js';
import { UserController } from '../controller/user.controller.js';
import { UserServiceImpl } from '../services/impl/user.service.impl.js';

const router = Router();

const userService = new UserServiceImpl();
const userController = new UserController(userService);

router.post(
  "/createUser",
  body("username").isString().trim().notEmpty().withMessage("username es requerido"),
  body("email").isEmail().withMessage("email inválido").normalizeEmail(),
  body("password").isString().isLength({ min: 8 }).withMessage("password mínimo 8 caracteres"),
  body("role").optional().isIn(["buyer", "admin"]).withMessage("role inválido"),
  validate,
  userController.create.bind(userController)
);

router.delete(
  "/deleteUser/:id",
  validateToken,
  requireAdmin,
  param("id").isMongoId(),
  validate,
  userController.remove.bind(userController)
);

router.get(
  "/listUsers",
  validateToken,
  requireAdmin,
  userController.list.bind(userController)
);

router.patch(
  "/updateUser/:id",
  validateToken,
  requireSelfOrAdmin,
  param("id").isMongoId(),
  body("username").optional().isString().trim().notEmpty(),
  body("email").optional().isEmail().withMessage("email inválido").normalizeEmail(),
  body("role").optional().isIn(["buyer", "admin"]).withMessage("role inválido"),
  validate,
  userController.update.bind(userController)
);

router.get(
  "/getUserInfo/:id",
  validateToken,
  requireSelfOrAdmin,
  param("id").isMongoId(),
  validate,
  userController.getInfo.bind(userController)
);

router.post(
  "/login",
  body("email").isEmail().withMessage("email inválido").normalizeEmail(),
  body("password").isString().notEmpty(),
  validate,
  userController.login.bind(userController)
);

router.get(
  "/verifyToken",
  validateToken,
  userController.verifytoken.bind(userController)
);

router.post(
  "/changePassword",
  validateToken,
  body("oldPassword").isString().notEmpty(),
  body("newPassword").isString().isLength({ min: 8 }),
  validate,
  userController.changePassword.bind(userController)
);

export default router;
