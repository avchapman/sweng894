CREATE TABLE "ParentChildLink" (
    "parentId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentChildLink_pkey" PRIMARY KEY ("parentId", "childProfileId")
);

CREATE INDEX "ParentChildLink_childProfileId_idx"
ON "ParentChildLink"("childProfileId");

ALTER TABLE "ParentChildLink"
ADD CONSTRAINT "ParentChildLink_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentChildLink"
ADD CONSTRAINT "ParentChildLink_childProfileId_fkey"
FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
