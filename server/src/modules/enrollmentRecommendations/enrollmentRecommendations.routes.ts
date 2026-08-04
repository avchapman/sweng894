import { UserRole } from "@prisma/client";
import { Router } from "express";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import { listEnrollmentRecommendations } from "./enrollmentRecommendations.controller";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  listEnrollmentRecommendations
);

export default router;
