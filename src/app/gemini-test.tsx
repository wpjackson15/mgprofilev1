"use client";
import React, { useState } from "react";
import { useGeminiSummary } from "@/hooks/useGeminiSummary";

export default function GeminiTestPage() {
  const [answersText, setAnswersText] = useState("");
  const [context, setContext] = useState("");
  const { generate, loading, error, result, reset } = useGeminiSummary();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const answers = answersText.split("\n").map(a => a.trim()).filter(Boolean);
    if (answers.length === 0) return;
    generate(answers, context);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Gemini Summary Test</h1>
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Answers (one per line):</span>
            <textarea
              className="border rounded px-3 py-2 min-h-[100px] text-gray-900"
              value={answersText}
              onChange={e => setAnswersText(e.target.value)}
              placeholder={"e.g.\nShe loves drawing and building things.\nShe wants to be a scientist or engineer."}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Context (optional):</span>
            <input
              className="border rounded px-3 py-2 text-gray-900"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. Interest Awareness Module"
            />
          </label>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading || !answersText.trim()}
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
          <button
            type="button"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
            onClick={reset}
            disabled={loading}
          >
            Reset
          </button>
        </form>
        {error && <div className="text-red-600 mt-4">Error: {error}</div>}
        {result && (
          <div className="mt-4">
            <div className="font-semibold mb-1">AI Summary:</div>
            <div className="bg-gray-100 rounded p-3 whitespace-pre-line text-gray-900">{result}</div>
          </div>
        )}
      </div>
    </main>
  );
} 