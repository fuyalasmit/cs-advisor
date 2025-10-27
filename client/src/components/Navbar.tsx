import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold">
                <span className="text-gray-900">AAMU</span>{" "}
                <span className="text-aamu-maroon">CS Advisor</span>
              </h1>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/courses"
                className="text-gray-700 hover:text-aamu-maroon transition-colors font-medium">
                Courses
              </Link>
              {isAuthenticated && (
                <Link
                  to="/students"
                  className="text-gray-700 hover:text-aamu-maroon transition-colors font-medium">
                  Students
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700 text-sm md:text-base hidden sm:inline">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm md:text-base font-medium text-white bg-aamu-maroon rounded-lg hover:bg-black-rose-800 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="px-4 py-2 text-sm md:text-base font-medium border border-aamu-maroon text-aamu-maroon rounded-lg hover:bg-black-rose-50 transition-colors">
                  Sign In
                </Link>
                <button className="px-4 py-2 text-sm md:text-base font-medium text-white bg-aamu-maroon rounded-lg hover:bg-black-rose-800 transition-colors">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
