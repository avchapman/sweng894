import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      include: [
        "src/middleware/auth.middleware.ts",
        "src/modules/auth/auth.service.ts",
        "src/modules/childProfiles/childProfiles.service.ts",
        "src/modules/enrollment/enrollment.service.ts",
        "src/modules/schedules/schedules.service.ts",
        "src/modules/parentPortal/parentPortal.service.ts",
        "src/modules/messages/messages.service.ts",
        "src/modules/invoices/invoices.service.ts",
        "src/modules/programCapacities/programCapacities.service.ts",
        "src/modules/enrollmentRecommendations/enrollmentRecommendations.algorithm.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
});
