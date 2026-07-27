import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../api/client";
import InvoicesPage from "./InvoicesPage";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("InvoicesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the create action and empty state after loading", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    render(<InvoicesPage />);

    expect(await screen.findByText("No invoices yet")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /create invoice/i })
    ).toHaveLength(2);
  });

  it("validates required fields before submitting an invoice", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    render(<InvoicesPage />);
    await screen.findByText("No invoices yet");

    fireEvent.click(screen.getAllByRole("button", { name: /create invoice/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Create Invoice" }));

    expect(
      await screen.findByText(
        "Invoice number, child, positive amount, and due date are required."
      )
    ).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("shows an alert when billing data cannot load", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("network"));

    render(<InvoicesPage />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to load billing information."
      )
    );
  });
});
