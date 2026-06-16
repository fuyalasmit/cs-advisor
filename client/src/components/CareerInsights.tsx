import React, { useState } from "react";
import { api } from "../lib/api";

interface IndustryPath {
  title: string;
  fit: "high" | "medium" | "low";
  reasoning: string;
  coursesToTake?: string[];
}

interface GradPath {
  title: string;
  fit: "high" | "medium" | "low";
  reasoning: string;
  requirements?: string[];
}

interface CareerInsightsData {
  industryPaths: IndustryPath[];
  gradPaths: GradPath[];
  skillGaps: string[];
  nextStep: string;
}

interface Props {
  studentId: number;
}

const fitBadge: Record<string, string> = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const CareerInsights: React.FC<Props> = ({ studentId }) => {
  const [insights, setInsights] = useState<CareerInsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.career.get(studentId);
      setInsights(data as CareerInsightsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Career Insights</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-powered recommendations based on completed courses and academic profile
          </p>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="shrink-0 px-4 py-2 bg-aamu-maroon text-white rounded-lg text-sm font-semibold hover:bg-black-rose-800 transition-colors disabled:opacity-50">
          {loading ? "Generating..." : insights ? "Refresh" : "Generate Insights"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3 mt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-6">
          {/* Industry Paths */}
          {insights.industryPaths.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Industry Paths
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {insights.industryPaths.map((path, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">
                        {path.title}
                      </p>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${fitBadge[path.fit] ?? fitBadge["low"]}`}>
                        {path.fit} fit
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{path.reasoning}</p>
                    {path.coursesToTake && path.coursesToTake.length > 0 && (
                      <div className="mt-auto pt-2">
                        <p className="text-xs text-gray-400 mb-1">Suggested courses:</p>
                        <div className="flex flex-wrap gap-1">
                          {path.coursesToTake.map((course, cidx) => (
                            <span
                              key={cidx}
                              className="text-xs px-1.5 py-0.5 bg-aamu-maroon/10 text-aamu-maroon rounded font-medium">
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graduate Study */}
          {insights.gradPaths.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Graduate Study
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.gradPaths.map((path, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{path.title}</p>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${fitBadge[path.fit] ?? fitBadge["low"]}`}>
                        {path.fit} fit
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{path.reasoning}</p>
                    {path.requirements && path.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {path.requirements.map((req, ridx) => (
                          <span
                            key={ridx}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Gaps */}
          {insights.skillGaps.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Skill Gaps to Address
              </h3>
              <div className="flex flex-wrap gap-2">
                {insights.skillGaps.map((gap, idx) => (
                  <span
                    key={idx}
                    className="text-sm px-3 py-1 bg-gray-50 text-gray-700 rounded-full border border-gray-200">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Advisor Note */}
          <div className="bg-aamu-maroon/5 border border-aamu-maroon/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-aamu-maroon uppercase tracking-wide mb-1.5">
              Advisor Recommendation
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{insights.nextStep}</p>
          </div>
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-sm font-medium text-gray-500">No insights generated yet</p>
          <p className="text-xs mt-1">
            Click "Generate Insights" to get AI-powered career recommendations based on this
            student's completed courses, grades, and concentration.
          </p>
        </div>
      )}
    </div>
  );
};

export default CareerInsights;
