import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authenticateToken,
  requireRole,
  type AuthenticatedRequest,
} from "./auth.middleware";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

function responseMock() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

describe("authentication and role middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request without a bearer token", () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = responseMock();
    const next = vi.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication token is required.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid bearer token and attaches its organization context", () => {
    const payload = {
      userId: "user-1",
      role: "ADMIN",
      organizationId: "org-1",
    };
    vi.mocked(jwt.verify).mockReturnValue(payload as never);
    const req = {
      headers: { authorization: "Bearer valid-token" },
    } as AuthenticatedRequest;
    const res = responseMock();
    const next = vi.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "valid-token",
      process.env.JWT_SECRET
    );
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects an invalid or expired token", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("expired");
    });
    const req = {
      headers: { authorization: "Bearer expired-token" },
    } as AuthenticatedRequest;
    const res = responseMock();
    const next = vi.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows an authenticated administrator through an admin route", () => {
    const req = {
      user: { userId: "user-1", role: "ADMIN", organizationId: "org-1" },
    } as AuthenticatedRequest;
    const res = responseMock();
    const next = vi.fn() as NextFunction;

    requireRole("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("denies an authenticated parent access to an admin route", () => {
    const req = {
      user: { userId: "user-2", role: "PARENT", organizationId: "org-1" },
    } as AuthenticatedRequest;
    const res = responseMock();
    const next = vi.fn() as NextFunction;

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects role checks when authentication context is missing", () => {
    const req = {} as AuthenticatedRequest;
    const res = responseMock();
    const next = vi.fn() as NextFunction;

    requireRole("ADMIN", "STAFF")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
