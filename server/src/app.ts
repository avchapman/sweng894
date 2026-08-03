import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./modules/auth/auth.routes";
import childProfileRoutes from "./modules/childProfiles/childProfiles.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";
import scheduleRoutes from "./modules/schedules/schedules.routes";
import parentPortalRoutes from "./modules/parentPortal/parentPortal.routes";
import messageRoutes from "./modules/messages/messages.routes";
import invoiceRoutes from "./modules/invoices/invoices.routes";
import enrollmentRecommendationRoutes from "./modules/enrollmentRecommendations/enrollmentRecommendations.routes";
import programCapacityRoutes from "./modules/programCapacities/programCapacities.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/child-profiles", childProfileRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/parent", parentPortalRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/enrollment-recommendations", enrollmentRecommendationRoutes);
app.use("/api/program-capacities", programCapacityRoutes);

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
