import { Router } from "express";
import { NavServiceImpl } from "../services/impl/navbar.service.impl.js";
import { optionalAuth } from "../middleware/checkRole.js";
import { NavController } from "../controller/navbar.controller.js";

const router = Router();

const navService = new NavServiceImpl();
const navController = new NavController(navService);

router.get("/menu", optionalAuth, (req, res, next) =>
  navController.getMenu(req, res, next)
);

export default router;
