import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-light">
            <Navbar />

            <section className="relative overflow-hidden gradient-hero">
                <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-black-rose-100 blur-3xl opacity-70" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-black-rose-200 blur-3xl opacity-60" />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
                    <div className="grid lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-7">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-gray-200 text-sm text-aamu-maroon font-medium">
                                CS Advisor AAMU
                            </div>
                            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mt-6">
                                Empowering Academic Excellence
                                <br />
                                Through <span className="text-aamu-maroon">Smart Advising</span>
                            </h1>

                            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mt-6">
                                A comprehensive platform designed to streamline academic advising for CS professors and
                                students at AAMU. Track progress, visualize degree requirements, and make informed
                                course recommendations.
                            </p>

                            <p className="text-base md:text-lg text-gray-600 max-w-2xl mt-5">
                                CS Advisor unifies curriculum requirements, prerequisites, and advising history so
                                faculty can review progress quickly and students can plan confident next steps.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 items-center mt-8">
                                <button
                                    onClick={() => navigate("/how-to-use")}
                                    className="px-8 py-3 text-base md:text-lg font-medium text-aamu-maroon border-2 border-aamu-maroon rounded-lg hover:bg-black-rose-100 transition-colors w-full sm:w-auto">
                                    How to Use
                                </button>
                                <button
                                    onClick={() => navigate("/courses")}
                                    className="px-8 py-3 text-base md:text-lg font-medium text-white bg-aamu-maroon rounded-lg hover:bg-aamu-maroon-light transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
                                    Explore Curriculum
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-6 md:p-8">
                                <div className="text-lg font-semibold text-gray-900">Advising snapshot</div>
                                <p className="text-sm text-gray-600 mt-2">
                                    A quick, professional view of what matters most during advising.
                                </p>
                                <div className="mt-6 space-y-3 text-sm text-gray-700">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-aamu-maroon" />
                                        <div>
                                            <div className="font-semibold text-gray-900">Progress visibility</div>
                                            <div className="text-gray-600">
                                                Review every semester with total credits and requirement categories.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-aamu-maroon" />
                                        <div>
                                            <div className="font-semibold text-gray-900">Course intelligence</div>
                                            <div className="text-gray-600">
                                                Open any course to view details, grades, and what it unlocks next.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-aamu-maroon" />
                                        <div>
                                            <div className="font-semibold text-gray-900">Decision-ready advising</div>
                                            <div className="text-gray-600">
                                                Keep advising choices clear and consistent across every student plan.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm text-center">
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">
                            Built around the AAMU CS curriculum
                        </h2>
                        <p className="text-gray-600 mt-4 max-w-3xl mx-auto">
                            Designed with required courses, GenEd categories, and concentration paths in mind so every
                            recommendation stays aligned with graduation requirements.
                        </p>
                    </div>
                </div>
            </section>

            <footer className="bg-white text-gray-700 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="text-lg font-semibold text-gray-900">CS Advisor AAMU</div>
                            <p className="text-sm text-gray-600 mt-1">
                                A streamlined advising platform for the AAMU Computer Science department.
                            </p>
                        </div>
                        <div className="text-sm text-gray-600">© 2026 csadvisoraamu.com. All rights reserved.</div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
