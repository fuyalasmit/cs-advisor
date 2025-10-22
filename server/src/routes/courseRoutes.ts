import express from "express";
import { z } from "zod";
import prisma from "../lib/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const querySchema = z.object({
      year: z.enum(["freshman", "sophomore", "junior", "senior"]).optional(),
      semester: z.enum(["first", "second"]).optional(),
      category: z.enum(["major", "genEd", "elective", "concentration"]).optional(),
    });

    const parsedQuery = querySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.issues,
      });
    }

    const { year, semester, category } = parsedQuery.data;

    const where: any = {};
    if (year) {
      where.year = year;
    }
    if (semester) {
      where.semester = semester;
    }

    const slots = await prisma.curriculumSlot.findMany({
      where,
      include: {
        course: true,
      },
      orderBy: [{ year: "asc" }, { semester: "asc" }, { id: "asc" }],
    });

    // if category filter is provided, we filter by course category or slotType
    let filteredSlots = slots;
    if (category) {
      filteredSlots = slots.filter((slot) => {
        if (slot.course) {
          return slot.course.category === category;
        }
        // check slotType for placeholder slots..genEd, concentration haru ko lagi..
        return slot.slotType === category;
      });
    }

    // organize the response..group by year and semester.
    const groupedCurriculum = filteredSlots.reduce((acc: any, slot) => {
      const key = `${slot.year}_${slot.semester}`;
      if (!acc[key]) {
        acc[key] = {
          year: slot.year,
          semester: slot.semester,
          slots: [],
        };
      }

      acc[key].slots.push({
        id: slot.id,
        slotType: slot.slotType,
        creditHour: slot.creditHour,
        minGrade: slot.minGrade,
        genEdCategory: slot.genEdCategory,

        ...(slot.course && {
          courseNo: slot.course.courseNo,
          title: slot.course.title,
          category: slot.course.category,
        }),

        ...(slot.slotType !== "fixed" && {
          placeholderType: slot.slotType,
          description: getPlaceholderDescription(slot),
        }),
      });

      return acc;
    }, {});

    // convert to array + calculate totals
    const curriculum = Object.values(groupedCurriculum).map((sem: any) => ({
      ...sem,
      totalCredits: sem.slots.reduce((sum: number, slot: any) => sum + slot.creditHour, 0),
    }));

    res.status(200).json({
      curriculum,
      total: filteredSlots.length,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/concentration", async (req, res) => {
  try {
    const concentrationCourses = await prisma.course.findMany({
      where: {
        category: "concentration",
      },
      include: {
        prerequisites: {
          include: {
            preReqCourse: true,
          },
        },
      },
      orderBy: {
        courseNo: "asc",
      },
    });

    const REQUIRED_CONCENTRATION = ["CS 381", "CS 384", "CS 488"];

    const requiredConc = concentrationCourses.filter((c) => REQUIRED_CONCENTRATION.includes(c.courseNo));
    const electiveConc = concentrationCourses.filter((c) => !REQUIRED_CONCENTRATION.includes(c.courseNo));

    res.status(200).json({
      requiredConc,
      electiveConc,
    });
  } catch (error) {
    console.error("Error fetching concentration courses:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/electives", async (req, res) => {
  try {
    const electives = await prisma.course.findMany({
      where: {
        category: "elective",
      },
      include: {
        prerequisites: {
          include: {
            preReqCourse: true,
          },
        },
      },
      orderBy: {
        courseNo: "asc",
      },
    });

    res.status(200).json({
      electives,
    });
  } catch (error) {
    console.error("Error fetching electives:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/gened/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const genEdCourses = await prisma.course.findMany({
      where: {
        category: "genEd",
        genEdCategory: category,
      },
      include: {
        prerequisites: {
          include: {
            preReqCourse: true,
          },
        },
      },
      orderBy: {
        courseNo: "asc",
      },
    });

    if (genEdCourses.length === 0) {
      return res.status(404).json({
        message: `No GenEd courses found for category: ${category}`,
      });
    }

    res.status(200).json({
      category,
      courses: genEdCourses,
    });
  } catch (error) {
    console.error("Error fetching GenEd courses:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:courseNo", async (req, res) => {
  try {
    const { courseNo } = req.params;

    const course = await prisma.course.findUnique({
      where: {
        courseNo: courseNo,
      },
      include: {
        prerequisites: {
          include: {
            preReqCourse: true,
          },
        },
        asPrerequisite: {
          include: {
            course: true,
          },
        },
        curriculumSlots: {
          select: {
            year: true,
            semester: true,
            slotType: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        message: `Course ${courseNo} not found`,
      });
    }

    // formatting preRed for better readibility
    const formattedPrerequisites = course.prerequisites.map((prereq) => ({
      type: prereq.preReqCourseId ? "course" : "requirement",
      courseNo: prereq.preReqCourse?.courseNo,
      courseTitle: prereq.preReqCourse?.title,
      minGrade: prereq.minGrade,
      operator: prereq.operator,
      extra: prereq.extra,
    }));

    // formatting "required for"
    const requiredFor = course.asPrerequisite.map((prereq) => ({
      courseNo: prereq.course.courseNo,
      title: prereq.course.title,
      minGrade: prereq.minGrade,
    }));

    res.status(200).json({
      courseNo: course.courseNo,
      title: course.title,
      creditHour: course.creditHour,
      minGrade: course.minGrade,
      category: course.category,
      genEdCategory: course.genEdCategory,
      prerequisites: formattedPrerequisites,
      requiredFor,
      appearsIn: course.curriculumSlots,
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

function getPlaceholderDescription(slot: any): string {
  switch (slot.slotType) {
    case "genEd":
      return `${slot.genEdCategory} – See GenEd Listing`;
    case "concentration":
      return "Concentration Course";
    case "elective":
      return "CS 3xx-4xx Elective";
    case "free":
      return "Free Elective";
    default:
      return "Elective";
  }
}

export default router;
