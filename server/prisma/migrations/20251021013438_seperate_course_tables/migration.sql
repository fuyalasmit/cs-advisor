/*
  Warnings:

  - You are about to drop the column `semester` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,courseId]` on the table `CompletedCourse` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Made the column `category` on table `Course` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `email` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "semester",
DROP COLUMN "year",
ALTER COLUMN "category" SET NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "concentration" TEXT NOT NULL DEFAULT 'GCS',
ADD COLUMN     "email" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CurriculumSlot" (
    "id" SERIAL NOT NULL,
    "year" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "courseId" TEXT,
    "slotType" TEXT NOT NULL,
    "creditHour" INTEGER NOT NULL,
    "minGrade" TEXT,

    CONSTRAINT "CurriculumSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompletedCourse_studentId_courseId_key" ON "CompletedCourse"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- AddForeignKey
ALTER TABLE "CurriculumSlot" ADD CONSTRAINT "CurriculumSlot_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseNo") ON DELETE SET NULL ON UPDATE CASCADE;
