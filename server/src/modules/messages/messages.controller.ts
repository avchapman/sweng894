import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  generateMessageDraft,
  getParentRecipients,
  sendParentMessage,
} from "./messages.service";

export async function listRecipients(req: AuthenticatedRequest, res: Response) {
  return res.json(await getParentRecipients(req.user!.organizationId));
}

export async function createMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const message = await sendParentMessage(
      req.user!.organizationId,
      req.user!.userId,
      req.body
    );
    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to send message.",
    });
  }
}

export function createDraft(req: AuthenticatedRequest, res: Response) {
  try {
    return res.json(generateMessageDraft(req.body));
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Unable to generate draft.",
    });
  }
}
