import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";

interface CompletedCourse {
  courseNo: string;
  title: string;
  creditHour: number;
  category: string;
  grade: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  stream: string;
  currentYear: string;
  currentSem: string;
  currentGpa: number | null;
  concentration: string;
  completedCourses: CompletedCourse[];
  totalCredits: number;
}

interface CourseOption {
  courseNo: string;
  title: string;
  creditHour: number;
}

interface Suggestion {
  slotType: string;
  courseNo?: string;
  title?: string;
  creditHour?: number;
  category?: string;
  options?: CourseOption[];
  message?: string;
  semester?: string;
}

interface MissedCourse {
  courseNo: string;
  title: string;
  creditHour: number;
  originalSemester: string;
}

interface SuggestionsData {
  studentId: number;
  studentName: string;
  currentYear: string;
  currentSemester: string;
  missedCourses: MissedCourse[];
  suggestions: Suggestion[];
}

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [studentData, suggestionsData] = await Promise.all([
          api.students.getById(parseInt(id)),
          api.suggestions.get(parseInt(id)),
        ]);

        setStudent(studentData.student);
        setSuggestions(suggestionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-aamu-maroon rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading student details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || "Student not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentSemesterSuggestions = suggestions?.suggestions.filter((s) => !s.semester) || [];
  const nextSemesterSuggestions = suggestions?.suggestions.filter((s) => s.semester) || [];

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/students")}
          className="mb-6 text-aamu-maroon hover:text-black-rose-800 font-medium flex items-center gap-2">
          ← Back to Students
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
              <p className="text-gray-600">{student.email}</p>
            </div>
            <button
              disabled
              className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed opacity-60">
              Edit Student
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Year</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{student.currentYear}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Semester</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{student.currentSem}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">GPA</p>
              <p className="text-lg font-semibold text-aamu-maroon">
                {student.currentGpa !== null ? student.currentGpa.toFixed(2) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Concentration</p>
              <p className="text-lg font-semibold text-gray-900">{student.concentration}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Completed Courses
              <span className="text-sm font-normal text-gray-600 ml-2">({student.totalCredits} credits)</span>
            </h2>

            {student.completedCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No completed courses yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {student.completedCourses.map((course, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {course.courseNo} - {course.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {course.creditHour} credits • {course.category}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        course.grade === "A"
                          ? "bg-black-rose-200 text-aamu-maroon-dark"
                          : course.grade === "B"
                          ? "bg-black-rose-100 text-aamu-maroon"
                          : course.grade === "C"
                          ? "bg-black-rose-50 text-aamu-maroon-light"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                      {course.grade}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Suggestions</h2>

            <div className="space-y-6">
              {suggestions?.missedCourses && suggestions.missedCourses.length > 0 && (
                <div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-aamu-maroon-dark">MISSED COURSES (PRIORITY)</h3>
                  </div>
                  <div className="space-y-2">
                    {suggestions.missedCourses.map((course, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-black-rose-50 border-l-4 border-aamu-maroon rounded-lg">
                        <p className="font-medium text-gray-900">
                          {course.courseNo} - {course.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Originally scheduled: {course.originalSemester} • {course.creditHour} credits
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSemesterSuggestions.length > 0 && (
                <div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-aamu-maroon">
                      CURRENT SEMESTER ({student.currentYear} - {student.currentSem})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {currentSemesterSuggestions.map((suggestion, idx) => (
                      <SuggestionCard key={idx} suggestion={suggestion} />
                    ))}
                  </div>
                </div>
              )}

              {nextSemesterSuggestions.length > 0 && (
                <div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-aamu-maroon-light">NEXT SEMESTER PREVIEW</h3>
                  </div>
                  <div className="space-y-3">
                    {nextSemesterSuggestions.map((suggestion, idx) => (
                      <SuggestionCard key={idx} suggestion={suggestion} />
                    ))}
                  </div>
                </div>
              )}

              {!suggestions?.missedCourses?.length &&
                !currentSemesterSuggestions.length &&
                !nextSemesterSuggestions.length && (
                  <p className="text-gray-500 text-center py-8">No suggestions available</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuggestionCard: React.FC<{ suggestion: Suggestion }> = ({ suggestion }) => {
  const [expanded, setExpanded] = useState(false);

  if (suggestion.slotType === "fixed") {
    return (
      <div className="p-3 bg-black-rose-50 border-l-4 border-black-rose-600 rounded-lg">
        <p className="font-medium text-gray-900">
          {suggestion.courseNo} - {suggestion.title}
        </p>
        <p className="text-sm text-gray-600 mt-1">{suggestion.creditHour} credits • Required</p>
      </div>
    );
  }

  return (
    <div className="border-l-4 border-aamu-maroon-light rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-3 bg-black-rose-50 hover:bg-black-rose-100 cursor-pointer flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900 capitalize">{suggestion.slotType}</p>
          {suggestion.message && <p className="text-sm text-gray-600">{suggestion.message}</p>}
          {suggestion.category && <p className="text-sm text-gray-600">Category: {suggestion.category}</p>}
        </div>
        <svg
          className={`w-5 h-5 text-aamu-maroon transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && suggestion.options && (
        <div className="p-3 bg-white border-t border-black-rose-200 space-y-2 max-h-64 overflow-y-auto">
          {suggestion.options.map((option, idx) => (
            <div key={idx} className="p-2 bg-black-rose-50 border-l-2 border-aamu-maroon-light rounded">
              <p className="text-sm font-medium text-gray-900">
                {option.courseNo} - {option.title}
              </p>
              <p className="text-xs text-gray-600">{option.creditHour} credits</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
