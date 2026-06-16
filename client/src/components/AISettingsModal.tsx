import React, { useState, useEffect } from "react";

const PROVIDERS = [
  { value: "gemini",  label: "Google Gemini" },
  { value: "claude",  label: "Anthropic Claude" },
  { value: "openai",  label: "OpenAI" },
] as const;

const LS_PROVIDER = "ai_provider";
const LS_API_KEY  = "ai_api_key";

interface Props {
  onClose: () => void;
}

const AISettingsModal: React.FC<Props> = ({ onClose }) => {
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey]     = useState("");
  const [showKey, setShowKey]   = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    setProvider(localStorage.getItem(LS_PROVIDER) ?? "gemini");
    setApiKey(localStorage.getItem(LS_API_KEY) ?? "");
  }, []);

  const handleSave = () => {
    localStorage.setItem(LS_PROVIDER, provider);
    localStorage.setItem(LS_API_KEY, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem(LS_PROVIDER);
    localStorage.removeItem(LS_API_KEY);
    setProvider("gemini");
    setApiKey("");
  };

  const isSaved = !!(localStorage.getItem(LS_API_KEY));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Stored in your browser — never sent to our servers except for AI calls.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon">
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === "gemini"  ? "AIza..." :
                  provider === "claude"  ? "sk-ant-..." :
                                           "sk-..."
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-aamu-maroon/20 focus:border-aamu-maroon"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            {isSaved && !saved && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Key saved — will be used for all AI features
              </p>
            )}
          </div>

          {/* Fallback note */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500">
            If no key is set here, the server's <code className="bg-gray-100 px-1 rounded">.env</code> key is used as fallback.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 px-4 py-2 bg-aamu-maroon text-white rounded-lg text-sm font-semibold hover:bg-black-rose-800 transition-colors disabled:opacity-50">
            {saved ? "Saved ✓" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { LS_PROVIDER, LS_API_KEY };
export default AISettingsModal;
