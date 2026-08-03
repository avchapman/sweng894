ALTER TABLE "EnrollmentRequest"
ADD COLUMN "requestedStartDate" TIMESTAMP(3),
ADD COLUMN "requestedProgram" TEXT,
ADD COLUMN "requestedAttendanceDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "siblingEnrolled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ProgramCapacity" (
  "id" TEXT NOT NULL,
  "programName" TEXT NOT NULL,
  "minimumAgeYears" INTEGER NOT NULL,
  "maximumAgeYears" INTEGER NOT NULL,
  "supportedAttendanceDays" TEXT[] NOT NULL,
  "totalCapacity" INTEGER NOT NULL,
  "occupiedSeats" INTEGER NOT NULL DEFAULT 0,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgramCapacity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnrollmentRequest_organizationId_requestedProgram_idx"
ON "EnrollmentRequest"("organizationId", "requestedProgram");

CREATE INDEX "ProgramCapacity_organizationId_effectiveDate_idx"
ON "ProgramCapacity"("organizationId", "effectiveDate");

CREATE UNIQUE INDEX "ProgramCapacity_organizationId_programName_effectiveDate_key"
ON "ProgramCapacity"("organizationId", "programName", "effectiveDate");

ALTER TABLE "ProgramCapacity"
ADD CONSTRAINT "ProgramCapacity_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
