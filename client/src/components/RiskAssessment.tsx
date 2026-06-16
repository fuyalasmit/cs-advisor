import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

interface RiskFlag {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

interface RiskData {
  level: "low" | "medium" | "high";
  score: number;
  flags: RiskFlag[];
  explanation?: string;
}

interface Props {
  studentId: number;
}

const levelConfig = {
  high: {
    border: "border-red-300",
    bg: "bg-red-50",
    title: "text-red-800",
    label: "High Risk",
    icon: "⚠",
    badgeBg: "bg-red-100 text-red-700",
  },
  medium: {
    border: "border-yellow-300",
    bg: "bg-yellow-50",
    title: "text-yellow-800",
    label: "At Risk",
    icon: "⚡",
    badgeBg: "bg-yellow-100 text-yellow-700",
  },
  low: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    title: "text-blue-800",
    label: "Low Risk",
    icon: "ℹ",
    badgeBg: "bg-blue-100 text-blue-700",
  },
};

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
};

const RiskAssessment: React.FC<Props> = ({ studentId }) => {
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    api.risk
      .get(studentId)
      .then(setRisk)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  const getAiExplanation = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const data = await api.risk.get(studentId, true);
      setRisk(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
    );
  }

  // Good standing — no flags
  if (!risk || risk.flags.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-lg">✓</span>
          <span className="text-sm font-bold uppercase tracking-wide text-green-800">
            Good Standing
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
            No risk factors detected
          </span>
        </div>
      </div>
    );
  }

  const cfg = levelConfig[risk.level];

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-4 mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold uppercase tracking-wide ${cfg.title}`}>
            {cfg.icon} Academic Risk — {cfg.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeBg}`}>
            Score: {risk.score}
          </span>
        </div>
        {!risk.explanation && (
          <button
            onClick={getAiExplanation}
            disabled={aiLoading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 shrink-0">
            {aiLoading ? "Analyzing..." : "Get AI Analysis"}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {risk.flags.map((flag, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${severityDot[flag.severity] ?? "bg-gray-400"}`}
            />
            <span className="text-gray-700">{flag.message}</span>
          </div>
        ))}
      </div>

      {aiError && (
        <p className="mt-3 text-xs text-red-600">{aiError}</p>
      )}

      {risk.explanation && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            AI Advisor Analysis
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{risk.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default RiskAssessment;
