import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const HowToUse: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How to <span className="text-aamu-maroon">Use</span>
          </h1>
          <p className="text-gray-600">A simple guide to navigating the CS Advisor platform</p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 bg-aamu-maroon text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Explore Course Curriculum</h2>
                <p className="text-gray-600 mb-3">
                  View the complete CS curriculum with prerequisite relationships and course details.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>Switch between list and graph views to visualize course dependencies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>Filter courses by academic year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>Click on any course to view prerequisites and required-for relationships</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 bg-aamu-maroon text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Student Dashboard</h2>
                <p className="text-gray-600 mb-3">
                  Sign in to access your advising dashboard and student information.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>View all students assigned to you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>Track student GPA and academic progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>Monitor concentration selections and semester status</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 bg-aamu-maroon text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Student Details</h2>
                <p className="text-gray-600 mb-3">
                  Click on any student card to access detailed academic information.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>View completed courses with grades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>See current semester enrollments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-aamu-maroon mt-1">•</span>
                    <span>Identify remaining requirements for graduation</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 bg-aamu-maroon text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Understand Course Categories</h2>
                <p className="text-gray-600 mb-3">
                  Courses are organized into distinct categories for easy identification.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-4 h-4 rounded bg-[#651d32] shrink-0"></div>
                    <span className="text-sm text-gray-700">Major Courses</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-4 h-4 rounded bg-[#902444] shrink-0"></div>
                    <span className="text-sm text-gray-700">Concentration</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-4 h-4 rounded bg-[#dc588a] shrink-0"></div>
                    <span className="text-sm text-gray-700">General Education</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-4 h-4 rounded bg-[#f1b0cc] shrink-0"></div>
                    <span className="text-sm text-gray-700">Electives</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/courses")}
            className="px-8 py-3 text-base md:text-lg font-medium text-white bg-aamu-maroon rounded-lg hover:bg-aamu-maroon-light transition-colors inline-flex items-center gap-2">
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
