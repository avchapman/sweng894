import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  archiveChildProfile,
  createChildProfile,
  getChildProfiles,
  updateChildProfile,
} from "./childProfiles.service";

type ChildProfileParams = {
  id: string;
};

type AuthenticatedChildProfileRequest = AuthenticatedRequest &
  Request<ChildProfileParams>;

export async function listChildProfiles(req: AuthenticatedRequest, res: Response) {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  const children = await getChildProfiles(organizationId);
  return res.json(children);
}

export async function createChildProfileHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  const { firstName, lastName, dateOfBirth, notes } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({
      message: "First name and last name are required.",
    });
  }

  const child = await createChildProfile(organizationId, {
    firstName,
    lastName,
    dateOfBirth,
    notes,
  });

  return res.status(201).json(child);
}

export async function updateChildProfileHandler(
  req: AuthenticatedChildProfileRequest,
  res: Response
) {
  const organizationId = req.user?.organizationId;
  const id = req.params.id;

  if (!organizationId) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  const result = await updateChildProfile(id, organizationId, req.body);

  if (result.count === 0) {
    return res.status(404).json({ message: "Child profile not found." });
  }

  return res.json({ message: "Child profile updated successfully." });
}

export async function archiveChildProfileHandler(
  req: AuthenticatedChildProfileRequest,
  res: Response
) {
  const organizationId = req.user?.organizationId;
  const id = req.params.id;

  if (!organizationId) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  const result = await archiveChildProfile(id, organizationId);

  if (result.count === 0) {
    return res.status(404).json({ message: "Child profile not found." });
  }

  return res.json({ message: "Child profile archived successfully." });
}