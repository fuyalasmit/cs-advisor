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

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
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

    fetchStudents();
  }, []);

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
            disabled
            className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed opacity-60">
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
                <p className="text-gray-500 text-sm mt-2">Add students via API to get started</p>
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

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button className="text-aamu-maroon hover:text-black-rose-800 text-sm font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Students;
