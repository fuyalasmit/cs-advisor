import express from "express";
import prisma from "../lib/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { calculateRisk } from "../services/riskService.js";
import { generateCompletion, type AiRequestOptions } from "../services/aiService.js";

const router = express.Router();
router.use(authMiddleware);

const YEAR_ORDER = ["freshman", "sophomore", "junior", "senior"] as const;
type Year = (typeof YEAR_ORDER)[number];

// GET /students/risk-summary — lightweight risk levels for all students (no AI)
router.get("/risk-summary", async (req, res) => {
  try {
    const teacherId = req.userId;
    if (!teacherId) return res.status(401).json({ message: "Unauthorized" });

    const students = await prisma.student.findMany({
      where: { teacherId },
      include: {
        completedCourses: {
          include: { course: { select: { creditHour: true } } },
        },
      },
    });

    const riskSummaries = students.map((student) => {
      const totalCredits = student.completedCourses.reduce(
        (sum, cc) => sum + cc.course.creditHour,
        0
      );
      const risk = calculateRisk({
        currentGpa: student.currentGpa,
        currentYear: student.currentYear,
        currentSem: student.currentSem,
        completedCourses: student.completedCourses.map((cc) => ({
          courseId: cc.courseId,
          grade: cc.grade,
        })),
        totalCompletedCredits: totalCredits,
        missedCourseCount: 0, // skipped for bulk performance
      });
      return {
        id: student.id,
        riskLevel: risk.level,
        topFlag: risk.flags[0]?.message ?? null,
      };
    });

    res.json({ riskSummaries });
  } catch (error) {
    console.error("Error fetching risk summary:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /students/:id/risk — detailed risk assessment with optional AI explanation
router.get("/:id/risk", async (req, res) => {
  try {
    const studentId = parseInt(req.params["id"] ?? "");
    const teacherId = req.userId;
    const explain = req.query["explain"] === "true";

    if (isNaN(studentId)) return res.status(400).json({ message: "Invalid student ID" });
    if (!teacherId) return res.status(401).json({ message: "Unauthorized" });

    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      include: {
        completedCourses: {
          include: { course: true },
        },
      },
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const totalCredits = student.completedCourses.reduce(
      (sum, cc) => sum + cc.course.creditHour,
      0
    );

    // Count missed fixed-slot courses from prior years (lightweight prereq-free check)
    const currentYearIndex = YEAR_ORDER.indexOf(student.currentYear as Year);
    const completedSet = new Set(student.completedCourses.map((cc) => cc.courseId));
    let missedCourseCount = 0;

    if (currentYearIndex > 0) {
      const pastYears: string[] = Array.from(YEAR_ORDER.slice(0, currentYearIndex));
      const pastSlots = await prisma.curriculumSlot.findMany({
        where: { year: { in: pastYears }, slotType: "fixed" },
        select: { courseId: true },
      });
      missedCourseCount = pastSlots.filter(
        (s) => s.courseId !== null && !completedSet.has(s.courseId)
      ).length;
    }

    const risk = calculateRisk({
      currentGpa: student.currentGpa,
      currentYear: student.currentYear,
      currentSem: student.currentSem,
      completedCourses: student.completedCourses.map((cc) => ({
        courseId: cc.courseId,
        grade: cc.grade,
      })),
      totalCompletedCredits: totalCredits,
      missedCourseCount,
    });

    let explanation: string | undefined;

    if (explain && risk.flags.length > 0) {
      const systemPrompt = `You are an academic advisor AI for Alabama A&M University (AAMU) Computer Science program.
Write a concise, professional 2-3 sentence assessment of a student's academic risk for their advisor.
Focus on the most critical issues and suggest concrete, actionable steps. Be direct and supportive — the advisor will use this to guide the student.`;

      const userPrompt = `Student: ${student.name}
Year: ${student.currentYear}, Semester: ${student.currentSem}
GPA: ${student.currentGpa !== null ? student.currentGpa.toFixed(2) : "Not recorded"}
Concentration: ${student.concentration}
Risk Level: ${risk.level.toUpperCase()}
Risk Flags:
${risk.flags.map((f) => `- [${f.severity.toUpperCase()}] ${f.message}`).join("\n")}

Write a 2-3 sentence advisor assessment with specific recommendations.`;

      const p = typeof req.headers["x-ai-provider"] === "string" ? req.headers["x-ai-provider"] : null;
      const k = typeof req.headers["x-ai-api-key"]  === "string" ? req.headers["x-ai-api-key"]  : null;
      const aiOpts: AiRequestOptions = {
        ...(p ? { provider: p } : {}),
        ...(k ? { apiKey: k }   : {}),
      };

      try {
        explanation = await generateCompletion(systemPrompt, userPrompt, aiOpts);
      } catch (err) {
        console.error("AI explanation error:", err);
        // Return without explanation rather than failing the whole request
      }
    }

    res.json({
      studentId: student.id,
      studentName: student.name,
      ...risk,
      ...(explanation !== undefined ? { explanation } : {}),
    });
  } catch (error) {
    console.error("Error fetching risk:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
