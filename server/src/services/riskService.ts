const GRADE_VALUES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };

// Core required CS/Math courses — D or F here is a critical flag
const CORE_COURSES = new Set([
  "CS 101", "CS 151", "CS 201", "CS 251", "CS 301", "CS 302",
  "CS 351", "CS 352", "CS 381", "MATH 115", "MATH 116", "MATH 215",
]);

// Expected cumulative credits by year/semester
const EXPECTED_CREDITS: Record<string, Record<string, number>> = {
  freshman:  { first: 15, second: 30  },
  sophomore: { first: 45, second: 60  },
  junior:    { first: 75, second: 90  },
  senior:    { first: 105, second: 120 },
};

export interface RiskInput {
  currentGpa: number | null;
  currentYear: string;
  currentSem: string;
  completedCourses: { courseId: string; grade: string }[];
  totalCompletedCredits: number;
  missedCourseCount: number;
}

export interface RiskFlag {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface RiskResult {
  level: "low" | "medium" | "high";
  score: number;
  flags: RiskFlag[];
}

export function calculateRisk(input: RiskInput): RiskResult {
  let score = 0;
  const flags: RiskFlag[] = [];

  // GPA checks
  if (input.currentGpa !== null) {
    if (input.currentGpa < 2.0) {
      score += 40;
      flags.push({
        severity: "critical",
        message: `GPA ${input.currentGpa.toFixed(2)} is below 2.0 — academic probation risk`,
      });
    } else if (input.currentGpa < 2.5) {
      score += 20;
      flags.push({
        severity: "high",
        message: `GPA ${input.currentGpa.toFixed(2)} is below 2.5 — at risk`,
      });
    } else if (input.currentGpa < 3.0) {
      score += 5;
      flags.push({
        severity: "low",
        message: `GPA ${input.currentGpa.toFixed(2)} is below 3.0`,
      });
    }
  }

  // D or F grade in a core required course
  for (const cc of input.completedCourses) {
    if (CORE_COURSES.has(cc.courseId)) {
      const gradeValue = GRADE_VALUES[cc.grade] ?? 0;
      if (gradeValue <= 1) {
        score += 15;
        flags.push({
          severity: "high",
          message: `Grade ${cc.grade} in core course ${cc.courseId}`,
        });
      }
    }
  }

  // Missed required courses from past semesters
  if (input.missedCourseCount > 3) {
    score += 20;
    flags.push({
      severity: "high",
      message: `${input.missedCourseCount} required courses missed from prior semesters`,
    });
  } else if (input.missedCourseCount > 0) {
    score += input.missedCourseCount * 8;
    flags.push({
      severity: "medium",
      message: `${input.missedCourseCount} required course${input.missedCourseCount > 1 ? "s" : ""} missed from prior semesters`,
    });
  }

  // Credits behind expected pace
  const expected = EXPECTED_CREDITS[input.currentYear]?.[input.currentSem] ?? 0;
  if (expected > 0 && input.totalCompletedCredits < expected) {
    const deficit = expected - input.totalCompletedCredits;
    if (deficit > 15) {
      score += 15;
      flags.push({
        severity: "high",
        message: `${deficit} credits behind expected pace (${input.totalCompletedCredits}/${expected} expected by now)`,
      });
    } else if (deficit > 6) {
      score += 8;
      flags.push({
        severity: "medium",
        message: `${deficit} credits behind expected pace (${input.totalCompletedCredits}/${expected} expected by now)`,
      });
    } else if (deficit > 0) {
      score += 3;
      flags.push({
        severity: "low",
        message: `Slightly behind credit pace (${input.totalCompletedCredits}/${expected} expected by now)`,
      });
    }
  }

  const level: "low" | "medium" | "high" =
    score >= 40 ? "high" : score >= 15 ? "medium" : "low";

  return { level, score, flags };
}
