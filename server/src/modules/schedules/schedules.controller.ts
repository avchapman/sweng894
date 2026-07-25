import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createScheduleEntry,
  deleteScheduleEntry,
  getScheduleEntries,
  updateScheduleEntry,
} from "./schedules.service";

type ScheduleParams = { id: string };
type AuthenticatedScheduleRequest = AuthenticatedRequest &
  Request<ScheduleParams>;

function organizationIdFrom(req: AuthenticatedRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    res.status(401).json({ message: "Authentication is required." });
  }
  return organizationId;
}

export async function listScheduleEntries(
  req: AuthenticatedRequest,
  res: Response
) {
  const organizationId = organizationIdFrom(req, res);
  if (!organizationId) return;

  const entries = await getScheduleEntries(organizationId);
  return res.json(entries);
}

export async function createScheduleEntryHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const organizationId = organizationIdFrom(req, res);
  if (!organizationId) return;

  const { title, startTime, endTime } = req.body;
  if (!title || !startTime || !endTime) {
    return res.status(400).json({
      message: "Title, start time, and end time are required.",
    });
  }

  try {
    const entry = await createScheduleEntry(organizationId, req.body);
    return res.status(201).json(entry);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to create schedule entry.",
    });
  }
}

export async function updateScheduleEntryHandler(
  req: AuthenticatedScheduleRequest,
  res: Response
) {
  const organizationId = organizationIdFrom(req, res);
  if (!organizationId) return;

  const { title, startTime, endTime } = req.body;
  if (!title || !startTime || !endTime) {
    return res.status(400).json({
      message: "Title, start time, and end time are required.",
    });
  }

  try {
    const entry = await updateScheduleEntry(
      req.params.id,
      organizationId,
      req.body
    );
    if (!entry) {
      return res.status(404).json({ message: "Schedule entry not found." });
    }
    return res.json(entry);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to update schedule entry.",
    });
  }
}

export async function deleteScheduleEntryHandler(
  req: AuthenticatedScheduleRequest,
  res: Response
) {
  const organizationId = organizationIdFrom(req, res);
  if (!organizationId) return;

  const result = await deleteScheduleEntry(req.params.id, organizationId);
  if (result.count === 0) {
    return res.status(404).json({ message: "Schedule entry not found." });
  }
  return res.json({ message: "Schedule entry deleted successfully." });
}
