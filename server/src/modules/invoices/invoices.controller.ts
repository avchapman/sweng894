import { InvoiceStatus } from "@prisma/client";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createInvoice,
  getBillingMetrics,
  getInvoices,
  getParentInvoices,
  updateInvoiceStatus,
} from "./invoices.service";

type InvoiceParams = { id: string };
type AuthenticatedInvoiceRequest = AuthenticatedRequest &
  Request<InvoiceParams>;

export async function listInvoices(req: AuthenticatedRequest, res: Response) {
  return res.json(await getInvoices(req.user!.organizationId));
}

export async function createInvoiceHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const invoice = await createInvoice(req.user!.organizationId, req.body);
    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Unable to create invoice.",
    });
  }
}

export async function updateInvoiceStatusHandler(
  req: AuthenticatedInvoiceRequest,
  res: Response
) {
  try {
    const invoice = await updateInvoiceStatus(
      req.params.id,
      req.user!.organizationId,
      req.body.status as InvoiceStatus
    );
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }
    return res.json(invoice);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Unable to update invoice.",
    });
  }
}

export async function listParentInvoices(
  req: AuthenticatedRequest,
  res: Response
) {
  return res.json(
    await getParentInvoices(req.user!.userId, req.user!.organizationId)
  );
}

export async function listBillingMetrics(
  req: AuthenticatedRequest,
  res: Response
) {
  return res.json(await getBillingMetrics(req.user!.organizationId));
}
