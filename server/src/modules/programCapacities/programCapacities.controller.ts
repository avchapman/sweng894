import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createProgramCapacity,
  getProgramCapacities,
  updateProgramCapacity,
} from "./programCapacities.service";

type CapacityParams = { id: string };
type AuthenticatedCapacityRequest = AuthenticatedRequest &
  Request<CapacityParams>;

export async function listProgramCapacities(
  req: AuthenticatedRequest,
  res: Response
) {
  return res.json(await getProgramCapacities(req.user!.organizationId));
}

export async function createProgramCapacityHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    return res
      .status(201)
      .json(await createProgramCapacity(req.user!.organizationId, req.body));
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Unable to create capacity.",
    });
  }
}

export async function updateProgramCapacityHandler(
  req: AuthenticatedCapacityRequest,
  res: Response
) {
  try {
    const capacity = await updateProgramCapacity(
      req.params.id,
      req.user!.organizationId,
      req.body
    );
    if (!capacity) {
      return res.status(404).json({ message: "Program capacity not found." });
    }
    return res.json(capacity);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Unable to update capacity.",
    });
  }
}
