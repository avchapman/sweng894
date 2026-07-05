import { Router } from "express";
import { login } from "./auth.controller";

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user with email and password, then returns a JWT for protected API access.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             adminLogin:
 *               summary: Admin user
 *               value:
 *                 email: admin@test.com
 *                 password: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Email and password are required.
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Invalid email or password.
 */
router.post("/login", login);

export default router;