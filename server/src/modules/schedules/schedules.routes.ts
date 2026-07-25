import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import {
  createScheduleEntryHandler,
  deleteScheduleEntryHandler,
  listScheduleEntries,
  updateScheduleEntryHandler,
} from "./schedules.controller";

const router = Router();

/**
 * @openapi
 * /api/schedules:
 *   get:
 *     summary: List schedule entries
 *     description: Returns schedule entries for the authenticated user's organization.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule entries returned successfully
 *       401:
 *         description: Authentication is required
 *       403:
 *         description: User role is not authorized
 *   post:
 *     summary: Create a schedule entry
 *     description: Creates an organization-scoped schedule entry and optionally assigns active child profiles.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleEntryRequest'
 *     responses:
 *       201:
 *         description: Schedule entry created successfully
 *       400:
 *         description: Invalid schedule data or child assignment
 */
router
  .route("/")
  .get(
    authenticateToken,
    requireRole(UserRole.ADMIN, UserRole.STAFF),
    listScheduleEntries
  )
  .post(
    authenticateToken,
    requireRole(UserRole.ADMIN, UserRole.STAFF),
    createScheduleEntryHandler
  );

/**
 * @openapi
 * /api/schedules/{id}:
 *   put:
 *     summary: Update a schedule entry
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleEntryRequest'
 *     responses:
 *       200:
 *         description: Schedule entry updated successfully
 *       404:
 *         description: Schedule entry not found
 *   delete:
 *     summary: Delete a schedule entry
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule entry deleted successfully
 *       404:
 *         description: Schedule entry not found
 */
router
  .route("/:id")
  .put(
    authenticateToken,
    requireRole(UserRole.ADMIN, UserRole.STAFF),
    updateScheduleEntryHandler
  )
  .delete(
    authenticateToken,
    requireRole(UserRole.ADMIN, UserRole.STAFF),
    deleteScheduleEntryHandler
  );

export default router;
