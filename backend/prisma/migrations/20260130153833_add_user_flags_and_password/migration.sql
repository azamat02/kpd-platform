-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canAccessPlatform" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "submitsBasicReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submitsKpi" BOOLEAN NOT NULL DEFAULT false;
