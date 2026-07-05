import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import {
  createEnrollmentRequestHandler,
  listEnrollmentRequests,
  updateEnrollmentStatusHandler,
} from "./enrollment.controller";

const router = Router();

/**
 * @openapi
 * /api/enrollment:
 *   post:
 *     summary: Submit enrollment inquiry
 *     description: Public endpoint for prospective parents to submit an enrollment inquiry.
 *     tags:
 *       - Enrollment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentName
 *               - email
 *               - childName
 *             properties:
 *               parentName:
 *                 type: string
 *                 example: Sarah Smith
 *               email:
 *                 type: string
 *                 example: sarah@example.com
 *               phone:
 *                 type: string
 *                 example: 555-123-4567
 *               childName:
 *                 type: string
 *                 example: Emma Smith
 *               childAge:
 *                 type: integer
 *                 example: 4
 *               message:
 *                 type: string
 *                 example: Interested in preschool enrollment.
 *     responses:
 *       201:
 *         description: Enrollment inquiry submitted
 *       400:
 *         description: Missing required fields
 */
router.post("/", createEnrollmentRequestHandler);

/**
 * @openapi
 * /api/enrollment:
 *   get:
 *     summary: List enrollment inquiries
 *     description: Protected endpoint for ADMIN and STAFF users to view enrollment inquiries.
 *     tags:
 *       - Enrollment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment inquiries returned successfully
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: User role is not authorized
 */
router.get(
  "/",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  listEnrollmentRequests
);

/**
 * @openapi
 * /api/enrollment/{id}/status:
 *   patch:
 *     summary: Update enrollment inquiry status
 *     description: Protected endpoint for ADMIN and STAFF users to update the status of an enrollment inquiry.
 *     tags:
 *       - Enrollment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: CONTACTED
 *     responses:
 *       200:
 *         description: Enrollment request status updated
 *       400:
 *         description: Status is required
 *       401:
 *         description: Authentication token is required
 *       403:
 *         description: User role is not authorized
 *       404:
 *         description: Enrollment request not found
 */
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  updateEnrollmentStatusHandler
);

export default router;