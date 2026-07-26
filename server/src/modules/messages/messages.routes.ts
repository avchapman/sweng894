import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import {
  createDraft,
  createMessage,
  listRecipients,
} from "./messages.controller";

const router = Router();

router.use(
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF)
);
router.get("/recipients", listRecipients);
router.post("/ai-draft", createDraft);
router.post("/", createMessage);

export default router;
