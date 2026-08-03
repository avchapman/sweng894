import { UserRole } from "@prisma/client";
import { Router } from "express";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import {
  createProgramCapacityHandler,
  listProgramCapacities,
  updateProgramCapacityHandler,
} from "./programCapacities.controller";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  listProgramCapacities
);
router.post(
  "/",
  authenticateToken,
  requireRole(UserRole.ADMIN),
  createProgramCapacityHandler
);
router.patch(
  "/:id",
  authenticateToken,
  requireRole(UserRole.ADMIN),
  updateProgramCapacityHandler
);

export default router;
