import { Request, Response } from "express";
import { loginUser } from "./auth.service";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const result = await loginUser(email, password);

    return res.json(result);
  } catch {
    return res.status(401).json({ message: "Invalid email or password." });
  }
}