import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../api/client";
import DashboardPage from "./DashboardPage";

vi.mock("../api/client", () => ({
  default: { get: vi.fn() },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      firstName: "Abby",
      lastName: "Chapman",
      role: "ADMIN",
      organizationName: "Dolbeare Elementary School",
    },
  }),
}));

describe("DashboardPage billing metrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders organization-scoped billing totals returned by the API", async () => {
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === "/child-profiles") return Promise.resolve({ data: [] });
      if (url === "/enrollment") return Promise.resolve({ data: [] });
      if (url === "/invoices/metrics") {
        return Promise.resolve({
          data: {
            invoiceCount: 5,
            paidCents: 102500,
            outstandingCents: 375000,
            overdueCount: 1,
          },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Billing Overview")).toBeInTheDocument();
    expect(screen.getByText("$1,025.00")).toBeInTheDocument();
    expect(screen.getByText("$3,750.00")).toBeInTheDocument();
    expect(screen.getByText("Invoices requiring follow-up")).toBeInTheDocument();
  });
});
