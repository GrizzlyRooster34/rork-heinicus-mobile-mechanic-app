-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "photos" TEXT[],
    "punctualityRating" INTEGER,
    "qualityRating" INTEGER,
    "communicationRating" INTEGER,
    "valueRating" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_jobId_reviewerId_key" ON "Review"("jobId", "reviewerId");

-- CreateIndex
CREATE INDEX "Review_revieweeId_createdAt_idx" ON "Review"("revieweeId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_jobId_idx" ON "Review"("jobId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey"
FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
