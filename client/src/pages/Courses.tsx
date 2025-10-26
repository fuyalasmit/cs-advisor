import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import CourseGraph from "../components/CourseGraph";
import { API_BASE_URL } from "../lib/api";

interface Course {
  courseNo: string;
  title: string;
  creditHour: number;
  category: string;
  genEdCategory?: string;
}

interface Prerequisite {
  type: string;
  courseNo?: string;
  courseTitle?: string;
  minGrade?: string;
  operator?: string;
  extra?: string;
}

interface CourseDetails extends Course {
  minGrade?: string;
  prerequisites: Prerequisite[];
  requiredFor: Array<{
    courseNo: string;
    title: string;
    minGrade?: string;
  }>;
}

interface CurriculumSlot {
  id: number;
  slotType: string;
  creditHour: number;
  minGrade?: string;
  genEdCategory?: string;
  courseNo?: string;
  title?: string;
  category?: string;
  placeholderType?: string;
  description?: string;
}

interface SemesterData {
  year: string;
  semester: string;
  slots: CurriculumSlot[];
  totalCredits: number;
}

type ViewMode = "graph" | "list";
type YearFilter = "all" | "freshman" | "sophomore" | "junior" | "senior";

const Courses: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedYear, setSelectedYear] = useState<YearFilter>("all");
  const [curriculum, setCurriculum] = useState<SemesterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState<Map<string, CourseDetails>>(new Map());

  // Fetch curriculum data
  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedYear !== "all") {
          params.append("year", selectedYear);
        }

        const response = await fetch(`${API_BASE_URL}/courses?${params}`);
        const data = await response.json();
        setCurriculum(data.curriculum || []);
      } catch (error) {
        console.error("Error fetching curriculum:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculum();
  }, [selectedYear]);

  // Fetch all course details for graph and list view
  useEffect(() => {
    const fetchAllCourseDetails = async () => {
      const coursesMap = new Map<string, CourseDetails>();

      // Get all unique course numbers from curriculum slots
      const courseNumbers = new Set<string>();
      curriculum.forEach((sem) => {
        sem.slots.forEach((slot) => {
          if (slot.courseNo) {
            courseNumbers.add(slot.courseNo);
          }
        });
      });

      // Fetch details for curriculum courses
      await Promise.all(
        Array.from(courseNumbers).map(async (courseNo) => {
          try {
            const response = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(courseNo)}`);
            const data = await response.json();
            coursesMap.set(courseNo, data);
          } catch (error) {
            console.error(`Error fetching details for ${courseNo}:`, error);
          }
        })
      );

      // Fetch concentration courses
      try {
        const response = await fetch(`${API_BASE_URL}/courses/concentration`);
        const data = await response.json();
        [...data.requiredConc, ...data.electiveConc].forEach((course: CourseDetails) => {
          coursesMap.set(course.courseNo, course);
        });
      } catch (error) {
        console.error("Error fetching concentration courses:", error);
      }

      // Fetch elective courses
      try {
        const response = await fetch(`${API_BASE_URL}/courses/electives`);
        const data = await response.json();
        data.electives.forEach((course: CourseDetails) => {
          coursesMap.set(course.courseNo, course);
        });
      } catch (error) {
        console.error("Error fetching elective courses:", error);
      }

      setAllCourses(coursesMap);
    };

    if (curriculum.length > 0) {
      fetchAllCourseDetails();
    }
  }, [curriculum]);

  const years: Array<{ value: YearFilter; label: string }> = [
    { value: "all", label: "All Years" },
    { value: "freshman", label: "Freshman" },
    { value: "sophomore", label: "Sophomore" },
    { value: "junior", label: "Junior" },
    { value: "senior", label: "Senior" },
  ];

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Course <span className="text-aamu-maroon">Curriculum</span>
          </h1>
          <p className="text-gray-600">any description here.</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Year Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as YearFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                {years.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list" ? "bg-aamu-maroon text-white" : "text-gray-700 hover:bg-gray-200"
                }`}>
                List View
              </button>
              <button
                onClick={() => setViewMode("graph")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "graph" ? "bg-aamu-maroon text-white" : "text-gray-700 hover:bg-gray-200"
                }`}>
                Graph View
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-aamu-maroon rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading curriculum...</p>
            </div>
          </div>
        ) : viewMode === "graph" ? (
          <CourseGraph curriculum={curriculum} courseDetails={allCourses} />
        ) : (
          <ListView curriculum={curriculum} courseDetails={allCourses} />
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#651d32]"></div>
              <span className="text-sm text-gray-700">Major Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#902444]"></div>
              <span className="text-sm text-gray-700">Concentration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#dc588a]"></div>
              <span className="text-sm text-gray-700">General Education</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#f1b0cc]"></div>
              <span className="text-sm text-gray-700">Electives</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// List View Component
const ListView: React.FC<{
  curriculum: SemesterData[];
  courseDetails: Map<string, CourseDetails>;
}> = ({ curriculum, courseDetails }) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleSlotClick = (slotId: number) => {
    const key = `slot-${slotId}`;
    if (selectedSlot === key) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(key);
    }
  };

  // Get options for placeholder slots
  const getPlaceholderOptions = (slot: CurriculumSlot): CourseDetails[] => {
    const options: CourseDetails[] = [];

    if (slot.slotType === "concentration") {
      courseDetails.forEach((course) => {
        if (course.category === "concentration") {
          options.push(course);
        }
      });
    } else if (slot.slotType === "elective") {
      courseDetails.forEach((course) => {
        if (course.category === "elective") {
          options.push(course);
        }
      });
    } else if (slot.slotType === "genEd" && slot.genEdCategory) {
      courseDetails.forEach((course) => {
        if (course.category === "genEd" && course.genEdCategory === slot.genEdCategory) {
          options.push(course);
        }
      });
    }

    return options;
  };

  return (
    <div className="space-y-6">
      {curriculum.map((semester, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-aamu-maroon text-white px-6 py-4">
            <h2 className="text-xl font-semibold capitalize">
              {semester.year} - {semester.semester} Semester
            </h2>
            <p className="text-sm opacity-90 mt-1">Total Credits: {semester.totalCredits}</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Course No</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Credits</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {semester.slots.map((slot, slotIdx) => {
                    const slotKey = `slot-${slot.id}`;
                    const isSelected = selectedSlot === slotKey;
                    const placeholderOptions = !slot.courseNo ? getPlaceholderOptions(slot) : [];

                    return (
                      <React.Fragment key={slotIdx}>
                        <tr
                          onClick={() => handleSlotClick(slot.id)}
                          className={`border-b border-gray-100 transition-colors hover:bg-gray-50 cursor-pointer ${
                            isSelected ? "bg-black-rose-50" : ""
                          }`}>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {slot.courseNo || "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {slot.title || slot.description || "Placeholder"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{slot.creditHour}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                slot.category === "major" || slot.slotType === "fixed"
                                  ? "bg-[#651d32]/10 text-[#651d32]"
                                  : slot.category === "concentration" || slot.slotType === "concentration"
                                  ? "bg-[#902444]/10 text-[#902444]"
                                  : slot.category === "genEd" || slot.slotType === "genEd"
                                  ? "bg-[#dc588a]/10 text-[#dc588a]"
                                  : "bg-[#f1b0cc]/10 text-[#ae2851]"
                              }`}>
                              {slot.category || slot.slotType}
                            </span>
                          </td>
                        </tr>
                        {isSelected && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 bg-gray-50">
                              {slot.courseNo && courseDetails.has(slot.courseNo) ? (
                                <CourseDetailsView course={courseDetails.get(slot.courseNo)!} />
                              ) : placeholderOptions.length > 0 ? (
                                <PlaceholderOptionsView slot={slot} options={placeholderOptions} />
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  No details available for this course
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Placeholder Options View Component
const PlaceholderOptionsView: React.FC<{
  slot: CurriculumSlot;
  options: CourseDetails[];
}> = ({ slot, options }) => {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">
          {slot.slotType === "concentration" && "Concentration Course Options"}
          {slot.slotType === "elective" && "Elective Course Options"}
          {slot.slotType === "genEd" && `GenEd Options - ${slot.genEdCategory}`}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose one from the available courses below ({options.length} options)
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {options.map((course) => (
          <div key={course.courseNo} className="border border-gray-200 rounded-lg">
            <div
              onClick={() => setExpandedCourse(expandedCourse === course.courseNo ? null : course.courseNo)}
              className="p-3 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-between">
              <div>
                <span className="font-medium text-aamu-maroon">{course.courseNo}</span>
                <span className="text-gray-700 ml-2">- {course.title}</span>
                <span className="text-gray-500 ml-2 text-sm">({course.creditHour} credits)</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedCourse === course.courseNo ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedCourse === course.courseNo && (
              <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50">
                <CourseDetailsView course={course} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Course Details View Component
const CourseDetailsView: React.FC<{ course: CourseDetails }> = ({ course }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Course Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Course Number:</span>
              <span className="font-medium text-aamu-maroon">{course.courseNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Title:</span>
              <span className="font-medium">{course.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Hours:</span>
              <span className="font-medium">{course.creditHour}</span>
            </div>
            {course.minGrade && (
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Grade:</span>
                <span className="font-medium">{course.minGrade}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium capitalize">{course.category}</span>
            </div>
            {course.genEdCategory && (
              <div className="flex justify-between">
                <span className="text-gray-600">GenEd Category:</span>
                <span className="font-medium">{course.genEdCategory}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Prerequisites</h3>
              <div className="space-y-2">
                {course.prerequisites.map((prereq, idx) => (
                  <div key={idx} className="text-sm bg-white rounded p-2 border border-gray-200">
                    {prereq.type === "course" ? (
                      <div>
                        <span className="font-medium text-aamu-maroon">{prereq.courseNo}</span>
                        {prereq.courseTitle && (
                          <span className="text-gray-600 ml-2">- {prereq.courseTitle}</span>
                        )}
                        {prereq.minGrade && (
                          <div className="text-xs text-gray-500 mt-1">Minimum grade: {prereq.minGrade}</div>
                        )}
                        {prereq.operator && (
                          <span className="text-xs text-gray-500 ml-2">({prereq.operator})</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-600">{prereq.extra}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {course.requiredFor && course.requiredFor.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Required For</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {course.requiredFor.map((req, idx) => (
              <div key={idx} className="text-sm bg-white rounded p-2 border border-gray-200">
                <span className="font-medium text-aamu-maroon">{req.courseNo}</span>
                <span className="text-gray-600 ml-2">- {req.title}</span>
                {req.minGrade && <div className="text-xs text-gray-500 mt-1">Min grade: {req.minGrade}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
