import React from "react";
import Navbar from "../components/Navbar";

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <section className="gradient-hero py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Empowering Academic Excellence <br />
              Through <span className="text-aamu-maroon">Smart Advising</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Intelligent course planning for AAMU Computer Science students with automated prerequisite
              tracking and personalized semester recommendations
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="px-8 py-3 text-base md:text-lg font-medium text-aamu-maroon border-2 border-aamu-maroon rounded-lg hover:bg-black-rose-100 transition-colors w-full sm:w-auto">
                How to Use?
              </button>
              <button className="px-8 py-3 text-base md:text-lg font-medium text-white bg-aamu-maroon rounded-lg hover:bg-aamu-maroon-light transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
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
      </section>
    </div>
  );
};

export default Landing;
