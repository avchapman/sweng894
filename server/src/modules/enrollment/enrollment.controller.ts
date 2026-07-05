import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createEnrollmentRequest,
  getEnrollmentRequests,
  updateEnrollmentStatus,
} from "./enrollment.service";

type EnrollmentParams = {
  id: string;
};

type AuthenticatedEnrollmentRequest = AuthenticatedRequest &
  Request<EnrollmentParams>;

export async function createEnrollmentRequestHandler(
  req: Request,
  res: Response
) {
  const { parentName, email, phone, childName, childAge, message } = req.body;

  if (!parentName || !email || !childName) {
    return res.status(400).json({
      message: "Parent name, email, and child name are required.",
    });
  }

  const enrollmentRequest = await createEnrollmentRequest({
    parentName,
    email,
    phone,
    childName,
    childAge,
    message,
  });

  return res.status(201).json(enrollmentRequest);
}

export async function listEnrollmentRequests(
  req: AuthenticatedRequest,
  res: Response
) {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  const enrollmentRequests = await getEnrollmentRequests(organizationId);
  return res.json(enrollmentRequests);
}

export async function updateEnrollmentStatusHandler(
  req: AuthenticatedEnrollmentRequest,
  res: Response
) {
  const organizationId = req.user?.organizationId;
  const id = req.params.id;
  const { status } = req.body;

  if (!organizationId) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  if (!status) {
    return res.status(400).json({ message: "Status is required." });
  }

  const result = await updateEnrollmentStatus(id, organizationId, status);

  if (result.count === 0) {
    return res.status(404).json({ message: "Enrollment request not found." });
  }

  return res.json({ message: "Enrollment request status updated successfully." });
}