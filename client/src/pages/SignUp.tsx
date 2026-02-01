import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

const SignUp: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 5) {
            setError("Password must be at least 5 characters");
            return;
        }

        setLoading(true);

        try {
            await api.auth.signup(name, email, password);
            setSuccess("Account created successfully! Redirecting to sign in...");
            setTimeout(() => {
                navigate("/signin");
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign up failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light">
            <Navbar />

            <div className="max-w-md mx-auto px-4 py-16">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Sign <span className="text-aamu-maroon">Up</span>
                    </h1>
                    <p className="text-gray-600 mb-8">Create an account to start advising students</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 text-sm">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                placeholder="Dr. John Smith"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                placeholder="your.email@aamu.edu"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                placeholder="At least 5 characters"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-aamu-maroon text-white py-3 rounded-lg font-semibold hover:bg-black-rose-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? "Creating account..." : "Sign Up"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-600">
                        Already have an account?{" "}
                        <Link to="/signin" className="text-aamu-maroon hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
