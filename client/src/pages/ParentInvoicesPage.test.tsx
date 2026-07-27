import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../api/client";
import ParentInvoicesPage from "./ParentInvoicesPage";

vi.mock("../api/client", () => ({
  default: { get: vi.fn() },
}));

const invoice = {
  id: "invoice-1",
  invoiceNumber: "INV-2026-1001",
  amountCents: 125000,
  dueDate: "2026-08-15T00:00:00.000Z",
  description: "August preschool tuition",
  status: "SENT",
  childProfile: {
    id: "child-1",
    firstName: "Emma",
    lastName: "Rivera",
  },
};

describe("ParentInvoicesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders linked-child invoice details without staff controls", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [invoice] });

    render(<ParentInvoicesPage />);

    expect(await screen.findByText("INV-2026-1001")).toBeInTheDocument();
    expect(screen.getByText("Emma Rivera")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
    expect(screen.getByText("Due August 15, 2026")).toBeInTheDocument();
    expect(screen.getByText("SENT")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create invoice/i })
    ).not.toBeInTheDocument();
  });

  it("shows a helpful empty state when no invoices are visible", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    render(<ParentInvoicesPage />);

    expect(await screen.findByText("No invoices to display")).toBeInTheDocument();
  });

  it("shows an alert when the parent invoice request fails", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("network"));

    render(<ParentInvoicesPage />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to load invoices. Please try again."
      )
    );
  });
});
