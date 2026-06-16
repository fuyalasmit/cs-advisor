import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AISettingsModal from "./AISettingsModal";

const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [showAISettings, setShowAISettings] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate("/signin");
    };

    return (
        <>
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
                                <span className="text-gray-700 text-sm md:text-base hidden sm:inline">
                                    {user?.name}
                                </span>
                                <button
                                    onClick={() => setShowAISettings(true)}
                                    title="AI Settings"
                                    className="p-2 text-gray-500 hover:text-aamu-maroon hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
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
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 text-sm md:text-base font-medium text-white bg-aamu-maroon rounded-lg hover:bg-black-rose-800 transition-colors">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>

        {showAISettings && <AISettingsModal onClose={() => setShowAISettings(false)} />}
        </>
    );
};

export default Navbar;
