import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import {
  listLinkedChildren,
  listLinkedChildSchedules,
} from "./parentPortal.controller";

const router = Router();

router.use(authenticateToken, requireRole(UserRole.PARENT));
router.get("/children", listLinkedChildren);
router.get("/schedules", listLinkedChildSchedules);

export default router;
