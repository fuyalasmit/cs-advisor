/*
  Warnings:

  - Added the required column `currentSem` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentYear` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "currentSem" TEXT NOT NULL,
ADD COLUMN     "currentYear" TEXT NOT NULL,
ALTER COLUMN "currentGpa" DROP NOT NULL;
