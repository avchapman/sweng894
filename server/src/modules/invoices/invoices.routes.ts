import { UserRole } from "@prisma/client";
import { Router } from "express";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import {
  createInvoiceHandler,
  listBillingMetrics,
  listInvoices,
  updateInvoiceStatusHandler,
} from "./invoices.controller";

const router = Router();

router.use(
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF)
);
router.get("/metrics", listBillingMetrics);
router.route("/").get(listInvoices).post(createInvoiceHandler);
router.patch("/:id/status", updateInvoiceStatusHandler);

export default router;
