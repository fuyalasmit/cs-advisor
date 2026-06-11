-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "holdReason" TEXT,
ADD COLUMN     "isOnHold" BOOLEAN NOT NULL DEFAULT false;
