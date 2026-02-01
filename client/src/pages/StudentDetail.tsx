import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api, API_BASE_URL } from "../lib/api";

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

interface AvailableCourse {
    courseNo: string;
    title: string;
    creditHour: number;
    category: string;
}

const StudentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<Student | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Add course modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [selectedGrade, setSelectedGrade] = useState<string>("A");
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Edit student modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        currentYear: "",
        currentSem: "",
        currentGpa: "",
        concentration: "",
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

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

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchAvailableCourses = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/courses`);
            const data = await response.json();
            const courses: AvailableCourse[] = [];
            data.curriculum?.forEach(
                (sem: {
                    slots?: {
                        courseNo?: string;
                        title?: string;
                        creditHour: number;
                        category?: string;
                        slotType?: string;
                    }[];
                }) => {
                    sem.slots?.forEach((slot) => {
                        if (slot.courseNo && !courses.find((c) => c.courseNo === slot.courseNo)) {
                            courses.push({
                                courseNo: slot.courseNo,
                                title: slot.title || "",
                                creditHour: slot.creditHour,
                                category: slot.category || slot.slotType || "",
                            });
                        }
                    });
                },
            );
            setAvailableCourses(courses.sort((a, b) => a.courseNo.localeCompare(b.courseNo)));
        } catch (err) {
            console.error("Failed to fetch courses:", err);
        }
    };

    const openAddModal = () => {
        setShowAddModal(true);
        setSearchQuery("");
        setSelectedCourse("");
        setSelectedGrade("A");
        setAddError("");
        fetchAvailableCourses();
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setSelectedCourse("");
        setAddError("");
    };

    const handleAddCourse = async () => {
        if (!selectedCourse || !id) return;

        setAddLoading(true);
        setAddError("");

        try {
            await api.students.addCompleted(parseInt(id), [{ courseNo: selectedCourse, grade: selectedGrade }]);
            closeAddModal();
            fetchData();
        } catch (err) {
            setAddError(err instanceof Error ? err.message : "Failed to add course");
        } finally {
            setAddLoading(false);
        }
    };

    const handleRemoveCourse = async (courseNo: string) => {
        if (!id) return;

        if (deleteConfirm !== courseNo) {
            setDeleteConfirm(courseNo);
            return;
        }

        try {
            await api.students.removeCompleted(parseInt(id), courseNo);
            setDeleteConfirm(null);
            fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove course");
        }
    };

    const cancelRemoveCourse = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirm(null);
    };

    const openEditStudentModal = () => {
        if (!student) return;
        setEditFormData({
            name: student.name,
            email: student.email,
            currentYear: student.currentYear,
            currentSem: student.currentSem,
            currentGpa: student.currentGpa?.toString() || "",
            concentration: student.concentration,
        });
        setEditError("");
        setShowEditModal(true);
    };

    const closeEditStudentModal = () => {
        setShowEditModal(false);
        setEditError("");
    };

    const handleEditStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setEditLoading(true);
        setEditError("");

        try {
            await api.students.update(parseInt(id), {
                name: editFormData.name,
                email: editFormData.email,
                currentYear: editFormData.currentYear,
                currentSem: editFormData.currentSem,
                currentGpa: editFormData.currentGpa ? parseFloat(editFormData.currentGpa) : null,
                concentration: editFormData.concentration,
            });
            closeEditStudentModal();
            fetchData();
        } catch (err) {
            setEditError(err instanceof Error ? err.message : "Failed to update student");
        } finally {
            setEditLoading(false);
        }
    };

    const filteredCourses = availableCourses.filter(
        (course) =>
            !student?.completedCourses.find((c) => c.courseNo === course.courseNo) &&
            (course.courseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.title.toLowerCase().includes(searchQuery.toLowerCase())),
    );

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
                            onClick={openEditStudentModal}
                            className="px-6 py-2 bg-aamu-maroon text-white rounded-lg font-semibold hover:bg-black-rose-800 transition-colors">
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Completed Courses
                                <span className="text-sm font-normal text-gray-600 ml-2">
                                    ({student.totalCredits} credits)
                                </span>
                            </h2>
                            <button
                                onClick={openAddModal}
                                className="px-4 py-2 bg-aamu-maroon text-white rounded-lg text-sm font-semibold hover:bg-black-rose-800 transition-colors">
                                + Add Course
                            </button>
                        </div>

                        {student.completedCourses.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No completed courses yet</p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {student.completedCourses.map((course, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {course.courseNo} - {course.title}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {course.creditHour} credits • {course.category}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                            {deleteConfirm === course.courseNo ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRemoveCourse(course.courseNo)}
                                                        className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-600 transition-all">
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={cancelRemoveCourse}
                                                        className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleRemoveCourse(course.courseNo)}
                                                    className="text-xs font-medium px-2 py-1 rounded text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                                    ✕
                                                </button>
                                            )}
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
                                        <h3 className="font-semibold text-aamu-maroon-dark">
                                            MISSED COURSES (PRIORITY)
                                        </h3>
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
                                                    Originally scheduled: {course.originalSemester} •{" "}
                                                    {course.creditHour} credits
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

            {/* Add Course Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Add Completed Course</h2>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {addError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm">{addError}</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Course</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                    placeholder="Search by course number or title..."
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                    {filteredCourses.length === 0 ? (
                                        <p className="p-3 text-gray-500 text-center text-sm">No courses available</p>
                                    ) : (
                                        filteredCourses.slice(0, 50).map((course) => (
                                            <div
                                                key={course.courseNo}
                                                onClick={() => setSelectedCourse(course.courseNo)}
                                                className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                                                    selectedCourse === course.courseNo
                                                        ? "bg-aamu-maroon/10 border-l-4 border-l-aamu-maroon"
                                                        : "hover:bg-gray-50"
                                                }`}>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">
                                                        {course.courseNo} - {course.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {course.creditHour} credits • {course.category}
                                                    </p>
                                                </div>
                                                {selectedCourse === course.courseNo && (
                                                    <span className="text-aamu-maroon font-bold text-lg">✓</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                <select
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon">
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="F">F</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                type="button"
                                onClick={closeAddModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCourse}
                                disabled={!selectedCourse || addLoading}
                                className="flex-1 px-4 py-2 bg-aamu-maroon text-white rounded-lg hover:bg-black-rose-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {addLoading ? "Adding..." : "Add Course"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
                        </div>

                        <form onSubmit={handleEditStudent}>
                            <div className="p-6 space-y-4">
                                {editError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                        {editError}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                        <select
                                            value={editFormData.currentYear}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, currentYear: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon">
                                            <option value="freshman">Freshman</option>
                                            <option value="sophomore">Sophomore</option>
                                            <option value="junior">Junior</option>
                                            <option value="senior">Senior</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                        <select
                                            value={editFormData.currentSem}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, currentSem: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon">
                                            <option value="fall">Fall</option>
                                            <option value="spring">Spring</option>
                                            <option value="summer">Summer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="4"
                                            value={editFormData.currentGpa}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, currentGpa: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                            placeholder="Optional"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Concentration
                                        </label>
                                        <select
                                            value={editFormData.concentration}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, concentration: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon">
                                            <option value="GCS">General Computer Science</option>
                                            <option value="AI">Artificial Intelligence</option>
                                            <option value="CYS">Cyber Security</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeEditStudentModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 px-4 py-2 bg-aamu-maroon text-white rounded-lg hover:bg-black-rose-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {editLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
