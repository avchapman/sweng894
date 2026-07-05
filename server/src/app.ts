import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./modules/auth/auth.routes";
import childProfileRoutes from "./modules/childProfiles/childProfiles.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/child-profiles", childProfileRoutes);
app.use("/api/enrollment", enrollmentRoutes);

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Confirms that the backend API is running.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;