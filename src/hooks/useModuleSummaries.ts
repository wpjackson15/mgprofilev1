import { useState, useCallback } from "react";

interface ModuleSummary {
  module: string;
  summary: string;
  status: "idle" | "generating" | "completed" | "error";
  error?: string;
}

export function useModuleSummaries() {
  const [summaries, setSummaries] = useState<ModuleSummary[]>([]);

  const generateSummary = useCallback(async (module: string, answers: string[]) => {
    // Check if summary already exists
    const existingIndex = summaries.findIndex(s => s.module === module);
    if (existingIndex >= 0 && summaries[existingIndex].status === "completed") {
      return summaries[existingIndex].summary;
    }

    // Add or update module with generating status
    setSummaries(prev => {
      const newSummaries = [...prev];
      const index = newSummaries.findIndex(s => s.module === module);
      const moduleSummary: ModuleSummary = {
        module,
        summary: "",
        status: "generating"
      };
      
      if (index >= 0) {
        newSummaries[index] = moduleSummary;
      } else {
        newSummaries.push(moduleSummary);
      }
      
      return newSummaries;
    });

    try {
      // Call the Claude API via Netlify function
      const response = await fetch("/.netlify/functions/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          answers, 
          context: `${module} Module` 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.statusText}`);
      }

      const data = await response.json();
      const summary = data.summary || "";

      // Update with completed status
      setSummaries(prev => {
        const newSummaries = [...prev];
        const index = newSummaries.findIndex(s => s.module === module);
        if (index >= 0) {
          newSummaries[index] = {
            module,
            summary,
            status: "completed"
          };
        }
        return newSummaries;
      });

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Update with error status
      setSummaries(prev => {
        const newSummaries = [...prev];
        const index = newSummaries.findIndex(s => s.module === module);
        if (index >= 0) {
          newSummaries[index] = {
            module,
            summary: "",
            status: "error",
            error: errorMessage
          };
        }
        return newSummaries;
      });

      throw error;
    }
  }, [summaries]);

  const getModuleSummary = useCallback((module: string) => {
    return summaries.find(s => s.module === module);
  }, [summaries]);

  const resetSummaries = useCallback(() => {
    setSummaries([]);
  }, []);

  return {
    summaries,
    generateSummary,
    getModuleSummary,
    resetSummaries
  };
} 