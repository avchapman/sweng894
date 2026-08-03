import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { getEnrollmentRecommendations } from "./enrollmentRecommendations.service";

export async function listEnrollmentRecommendations(
  req: AuthenticatedRequest,
  res: Response
) {
  return res.json(
    await getEnrollmentRecommendations(req.user!.organizationId)
  );
}
