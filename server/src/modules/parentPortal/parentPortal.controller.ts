import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  getLinkedChildren,
  getLinkedChildSchedules,
} from "./parentPortal.service";

export async function listLinkedChildren(
  req: AuthenticatedRequest,
  res: Response
) {
  const children = await getLinkedChildren(
    req.user!.userId,
    req.user!.organizationId
  );
  return res.json(children);
}

export async function listLinkedChildSchedules(
  req: AuthenticatedRequest,
  res: Response
) {
  const schedules = await getLinkedChildSchedules(
    req.user!.userId,
    req.user!.organizationId
  );
  return res.json(schedules);
}
