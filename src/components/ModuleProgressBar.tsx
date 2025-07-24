import React from "react";

interface ModuleProgressBarProps {
  module: string;
  status: "idle" | "generating" | "completed" | "error";
  summary?: string;
  error?: string;
  progress: number; // 0-100
  onRetry?: () => void;
}

export default function ModuleProgressBar({
  module,
  status,
  summary,
  error,
  progress,
  onRetry
}: ModuleProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "generating":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "completed":
        return "✓ Complete";
      case "generating":
        return "Generating...";
      case "error":
        return "Error";
      default:
        return "Pending";
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">
          {module}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          status === "completed" ? "bg-green-100 text-green-800" :
          status === "generating" ? "bg-blue-100 text-blue-800" :
          status === "error" ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-600"
        }`}>
          {getStatusText()}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-500 bg-green-500`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Summary or Error Display */}
      {status === "completed" && summary && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {status === "error" && error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-700 mb-2">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {status === "generating" && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-sm text-blue-700">Generating AI summary...</p>
          </div>
        </div>
      )}
    </div>
  );
} 