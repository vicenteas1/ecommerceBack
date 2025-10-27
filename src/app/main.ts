import 'dotenv/config';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import mongoose from 'mongoose';
import { Logger } from './config/logger.js';
import { connectDB } from './config/db.mongo.js';
import UsersRouter from './routes/user.routes.js';
import NavbarRouter from './routes/navbar.routes.js';
import PurchaseRouter from './routes/purchases.routes.js';
import SalesRouter from './routes/sales.routes.js';
import CategoryRouter from './routes/category.routes.js';
import TypeRouter from './routes/type.routes.js';
import ItemRouter from './routes/item.routes.js';
import PaymentsRouter from './routes/payment.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(path.join(__dirname, "config", "swagger.yaml"));

const app = express();
const port = process.env.PORT || 3000;

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://ecommercefront-vxqk.onrender.com",
];

if (process.env.FRONT_URL) defaultOrigins.push(process.env.FRONT_URL);

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    Logger.info(`Origen no admitido: ${origin}`);
    return callback(new Error(`CORS: Origen no admitido: ${origin}`));
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState,
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { explorer: true })
);

app.use("/api/users", UsersRouter);
app.use("/api/items", ItemRouter);
app.use("/api/navbar", NavbarRouter);
app.use("/api/purchases", PurchaseRouter);
app.use("/api/sales", SalesRouter);
app.use("/api/categories", CategoryRouter);
app.use("/api/types", TypeRouter);
app.use("/api/payments", PaymentsRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Unexpected error";
    if (process.env.NODE_ENV !== "production") {
      Logger.error(err.stack || err);
    }
    res.status(status).json({ error: message });
  }
);

connectDB().then(() => {
  app.listen(port, () => {
    Logger.info(`API up: http://localhost:${port}`);
    Logger.info(`Swagger: http://localhost:${port}/api-docs`);
    Logger.info(`CORS allowed: ${allowedOrigins.join(", ") || "(none)"}`);
  });
});
