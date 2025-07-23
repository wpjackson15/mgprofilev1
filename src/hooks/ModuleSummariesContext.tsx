import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ModuleSummary {
  module: string;
  summary: string;
  status: "idle" | "generating" | "completed" | "error";
  error?: string;
}

interface ModuleSummariesContextType {
  summaries: ModuleSummary[];
  generateSummary: (module: string, answers: string[]) => Promise<string>;
  getModuleSummary: (module: string) => ModuleSummary | undefined;
  resetSummaries: () => void;
}

const ModuleSummariesContext = createContext<ModuleSummariesContextType | undefined>(undefined);

export function ModuleSummariesProvider({ children }: { children: ReactNode }) {
  const [summaries, setSummaries] = useState<ModuleSummary[]>([]);

  const generateSummary = useCallback(async (module: string, answers: string[]) => {
    // Always use functional setSummaries to avoid stale closure
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
      const response = await fetch("/.netlify/functions/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, context: `${module} Module` }),
      });
      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.statusText}`);
      }
      const data = await response.json();
      const summary = data.summary || "";
      setSummaries(prev => {
        const newSummaries = [...prev];
        const index = newSummaries.findIndex(s => s.module === module);
        if (index >= 0) {
          newSummaries[index] = {
            module,
            summary,
            status: "completed"
          };
        } else {
          newSummaries.push({ module, summary, status: "completed" });
        }
        return newSummaries;
      });
      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
        } else {
          newSummaries.push({ module, summary: "", status: "error", error: errorMessage });
        }
        return newSummaries;
      });
      throw error;
    }
  }, []);

  const getModuleSummary = useCallback((module: string) => {
    return summaries.find(s => s.module === module);
  }, [summaries]);

  const resetSummaries = useCallback(() => {
    setSummaries([]);
  }, []);

  return (
    <ModuleSummariesContext.Provider value={{ summaries, generateSummary, getModuleSummary, resetSummaries }}>
      {children}
    </ModuleSummariesContext.Provider>
  );
}

export function useModuleSummaries() {
  const ctx = useContext(ModuleSummariesContext);
  if (!ctx) throw new Error("useModuleSummaries must be used within a ModuleSummariesProvider");
  return ctx;
} 