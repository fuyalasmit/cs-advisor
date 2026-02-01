import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";

interface Student {
  id: number;
  name: string;
  email: string;
  stream: string;
  currentYear: string;
  currentSem: string;
  currentGpa: number | null;
  concentration: string;
}

interface StudentFormData {
  name: string;
  email: string;
  currentYear: string;
  currentSem: string;
  currentGpa: string;
  concentration: string;
}

const emptyFormData: StudentFormData = {
  name: "",
  email: "",
  currentYear: "freshman",
  currentSem: "first",
  currentGpa: "",
  concentration: "GCS",
};

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(emptyFormData);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.students.getAll();
      setStudents(data.students || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setFormData(emptyFormData);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      currentYear: student.currentYear,
      currentSem: student.currentSem,
      currentGpa: student.currentGpa?.toString() || "",
      concentration: student.concentration,
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData(emptyFormData);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        currentYear: formData.currentYear,
        currentSem: formData.currentSem,
        concentration: formData.concentration,
        currentGpa: formData.currentGpa ? parseFloat(formData.currentGpa) : null,
      };

      if (modalMode === "add") {
        await api.students.create(payload);
      } else if (editingStudent) {
        await api.students.update(editingStudent.id, payload);
      }

      closeModal();
      fetchStudents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }

    try {
      await api.students.delete(id);
      setDeleteConfirm(null);
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete student");
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              My <span className="text-aamu-maroon">Students</span>
            </h1>
            <p className="text-gray-600">Manage and track your students' academic progress</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-aamu-maroon text-white rounded-lg font-semibold hover:bg-black-rose-800 transition-colors">
            + Add Student
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-aamu-maroon rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading students...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {students.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600 text-lg">No students found</p>
                <p className="text-gray-500 text-sm mt-2">Click "Add Student" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-aamu-maroon/50 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      {student.currentGpa !== null && (
                        <div className="bg-aamu-maroon/10 text-aamu-maroon px-3 py-1 rounded-full text-sm font-semibold">
                          {student.currentGpa.toFixed(2)} GPA
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Year:</span>
                        <span className="font-medium text-gray-900 capitalize">{student.currentYear}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Semester:</span>
                        <span className="font-medium text-gray-900 capitalize">{student.currentSem}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Concentration:</span>
                        <span className="font-medium text-gray-900">{student.concentration}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <button className="text-aamu-maroon hover:text-black-rose-800 text-sm font-medium">
                        View Details →
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => openEditModal(student, e)}
                          className="text-gray-500 hover:text-aamu-maroon text-sm font-medium">
                          Edit
                        </button>
                        {deleteConfirm === student.id ? (
                          <>
                            <button
                              onClick={(e) => handleDelete(student.id, e)}
                              className="text-sm font-medium text-red-600 hover:text-red-800">
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(null);
                              }}
                              className="text-sm font-medium text-gray-500 hover:text-gray-700">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => handleDelete(student.id, e)}
                            className="text-sm font-medium text-gray-500 hover:text-red-600">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {modalMode === "add" ? "Add New Student" : "Edit Student"}
              </h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                    placeholder="Student name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                    placeholder="student@aamu.edu"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={formData.currentYear}
                      onChange={(e) => setFormData({ ...formData, currentYear: e.target.value })}
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
                      value={formData.currentSem}
                      onChange={(e) => setFormData({ ...formData, currentSem: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon">
                      <option value="first">First</option>
                      <option value="second">Second</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GPA (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={formData.currentGpa}
                      onChange={(e) => setFormData({ ...formData, currentGpa: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                      placeholder="0.00 - 4.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Concentration</label>
                    <select
                      value={formData.concentration}
                      onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon">
                      <option value="GCS">General Computer Science</option>
                      <option value="AI">Artificial Intelligence</option>
                      <option value="CYS">Cyber Security</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 bg-aamu-maroon text-white rounded-lg hover:bg-black-rose-800 transition-colors disabled:opacity-50">
                    {formLoading ? "Saving..." : modalMode === "add" ? "Add Student" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
