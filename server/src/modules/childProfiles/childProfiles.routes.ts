import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateToken,
  requireRole,
} from "../../middleware/auth.middleware";
import {
  archiveChildProfileHandler,
  createChildProfileHandler,
  listChildProfiles,
  updateChildProfileHandler,
} from "./childProfiles.controller";

const router = Router();

/**
 * @openapi
 * /api/child-profiles:
 *   get:
 *     summary: List child profiles
 *     description: Returns active child profiles for the authenticated user's organization. Organization filtering is enforced from the JWT, not from user-provided request data.
 *     tags:
 *       - Child Profiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Child profiles returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChildProfile'
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User role is not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  listChildProfiles
);

/**
 * @openapi
 * /api/child-profiles:
 *   post:
 *     summary: Create a child profile
 *     description: Creates a child profile for the authenticated user's organization. Only ADMIN and STAFF users may create child profiles.
 *     tags:
 *       - Child Profiles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChildProfileCreateRequest'
 *           examples:
 *             basicChildProfile:
 *               summary: Basic child profile
 *               value:
 *                 firstName: Emma
 *                 lastName: Smith
 *                 dateOfBirth: "2020-05-12"
 *                 notes: Peanut allergy
 *     responses:
 *       201:
 *         description: Child profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChildProfile'
 *       400:
 *         description: Missing required child profile fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User role is not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  createChildProfileHandler
);

/**
 * @openapi
 * /api/child-profiles/{id}:
 *   put:
 *     summary: Update a child profile
 *     description: Updates a child profile only if it belongs to the authenticated user's organization.
 *     tags:
 *       - Child Profiles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChildProfileCreateRequest'
 *           examples:
 *             updateChildProfile:
 *               summary: Update child profile
 *               value:
 *                 firstName: Emma
 *                 lastName: Johnson
 *                 dateOfBirth: "2020-05-12"
 *                 notes: Updated profile notes
 *     responses:
 *       200:
 *         description: Child profile updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Child profile updated successfully.
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: User role is not authorized
 *       404:
 *         description: Child profile not found
 */
router.put(
  "/:id",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  updateChildProfileHandler
);

/**
 * @openapi
 * /api/child-profiles/{id}/archive:
 *   patch:
 *     summary: Archive a child profile
 *     description: Soft-archives a child profile only if it belongs to the authenticated user's organization.
 *     tags:
 *       - Child Profiles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child profile ID
 *     responses:
 *       200:
 *         description: Child profile archived successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Child profile archived successfully.
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: User role is not authorized
 *       404:
 *         description: Child profile not found
 */
router.patch(
  "/:id/archive",
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  archiveChildProfileHandler
);

export default router;