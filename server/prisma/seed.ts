import prisma from "../src/lib/db.js";
import { readFileSync } from "fs";
import { join } from "path";

function readJsonFile<T>(filename: string): T {
  const filePath = join(process.cwd(), "src/constants", filename);
  const fileContent = readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}

interface CourseData {
  courseNo: string;
  title: string;
  creditHour: number;
  minGrade: string | null;
  category: string;
  genEdCategory?: string;
}

interface CurriculumSlotData {
  year: string;
  semester: string;
  courseId: string | null;
  slotType: string;
  creditHour: number;
  minGrade: string | null;
  genEdCategory?: string | null;
}

interface PrerequisiteData {
  courseId: string;
  preReqCourseId: string | null;
  minGrade: string | null;
  operator: string | null;
  extra: string | null;
}

async function seedCourses() {
  console.log("Seeding courses...");

  const majorGenEdCourses = readJsonFile<CourseData[]>("courses.json");
  const concentrationCourses = readJsonFile<CourseData[]>("concentrationCourseDetails.json");
  const electiveCourses = readJsonFile<CourseData[]>("electiveCourseDetails.json");

  const allCourses = [...majorGenEdCourses, ...concentrationCourses, ...electiveCourses];

  for (const course of allCourses) {
    await prisma.course.upsert({
      where: { courseNo: course.courseNo },
      update: {},
      create: {
        courseNo: course.courseNo,
        title: course.title,
        creditHour: course.creditHour,
        minGrade: course.minGrade,
        category: course.category,
        genEdCategory: course.genEdCategory || null,
      },
    });
  }

  console.log(`Seeded ${allCourses.length} courses`);
}

async function seedCurriculumSlots() {
  console.log("Seeding curriculum slots...");

  const slots = readJsonFile<CurriculumSlotData[]>("curriculumSlots.json");

  for (const slot of slots) {
    await prisma.curriculumSlot.create({
      data: {
        year: slot.year,
        semester: slot.semester,
        courseId: slot.courseId,
        slotType: slot.slotType,
        creditHour: slot.creditHour,
        minGrade: slot.minGrade,
        genEdCategory: slot.genEdCategory || null,
      },
    });
  }

  console.log(`Seeded ${slots.length} curriculum slots`);
}

async function seedPrerequisites() {
  console.log("Seeding prerequisites...");

  const prerequisites = readJsonFile<PrerequisiteData[]>("preReqDetails.json");
  let count = 0;
  let errors = 0;

  for (const prereq of prerequisites) {
    if (prereq.preReqCourseId === "") continue;

    try {
      await prisma.prerequisite.create({
        data: {
          courseId: prereq.courseId,
          preReqCourseId: prereq.preReqCourseId,
          minGrade: prereq.minGrade || null,
          operator: prereq.operator || null,
          extra: prereq.extra || null,
        },
      });
      count++;
    } catch (error) {
      console.log(`Skipping: ${prereq.courseId} (course not found)`);
      errors++;
    }
  }

  console.log(`Seeded ${count} prerequisites (${errors} skipped)`);
}

async function clearDatabase() {
  await prisma.completedCourse.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.prerequisite.deleteMany();
  await prisma.curriculumSlot.deleteMany();
  await prisma.course.deleteMany();
}

async function main() {
  console.log("Starting database seed...\n");

  await clearDatabase();
  await seedCourses();
  await seedCurriculumSlots();
  await seedPrerequisites();

  const courseCount = await prisma.course.count();
  const slotCount = await prisma.curriculumSlot.count();
  const prereqCount = await prisma.prerequisite.count();

  console.log("\nSeeding completed:");
  console.log(`- ${courseCount} courses`);
  console.log(`- ${slotCount} curriculum slots`);
  console.log(`- ${prereqCount} prerequisites\n`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
