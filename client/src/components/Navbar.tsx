import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="text-gray-900">AAMU</span> <span className="text-aamu-maroon">CS Advisor</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm md:text-base font-medium text-aamu-maroon border border-aamu-maroon rounded-lg hover:bg-black-rose-50 transition-colors">
              Sign Up
            </button>
            <button className="px-4 py-2 text-sm md:text-base font-medium text-white bg-aamu-maroon rounded-lg hover:bg-aamu-maroon-light transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
