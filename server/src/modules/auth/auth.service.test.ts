import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcrypt", () => ({
  default: { compare: vi.fn() },
}));
vi.mock("jsonwebtoken", () => ({
  default: { sign: vi.fn() },
}));
vi.mock("../../lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn() },
  },
}));

import prisma from "../../lib/prisma";
import { loginUser } from "./auth.service";

const user = {
  id: "user-1",
  firstName: "Abby",
  lastName: "Chapman",
  email: "abby@example.com",
  passwordHash: "hash",
  role: "ADMIN",
  organizationId: "org-1",
  organization: { name: "BrightPath" },
};

describe("loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("returns a token and safe user details for valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue("signed-token" as never);

    const result = await loginUser(user.email, "correct-password");

    expect(result.token).toBe("signed-token");
    expect(result.user).toEqual({
      id: "user-1",
      firstName: "Abby",
      lastName: "Chapman",
      email: "abby@example.com",
      role: "ADMIN",
      organizationId: "org-1",
      organizationName: "BrightPath",
    });
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("rejects an unknown email without comparing passwords", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(loginUser("missing@example.com", "password")).rejects.toThrow(
      "Invalid email or password"
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password with the same generic error", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(loginUser(user.email, "wrong-password")).rejects.toThrow(
      "Invalid email or password"
    );
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
