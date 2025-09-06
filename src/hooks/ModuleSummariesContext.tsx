import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ModuleSummary {
  module: string;
  summary: string;
  status: "idle" | "generating" | "completed" | "error";
  error?: string;
}

interface ModuleSummariesContextType {
  summaries: ModuleSummary[];
  generateSummary: (module: string, answers: string[], userId?: string, childName?: string, childPronouns?: string) => Promise<string>;
  getModuleSummary: (module: string) => ModuleSummary | undefined;
  resetSummaries: () => void;
  loadSummariesFromProgress: (answers: Record<string, string[]>, userId?: string) => Promise<void>;
}

const ModuleSummariesContext = createContext<ModuleSummariesContextType | undefined>(undefined);

export function ModuleSummariesProvider({ children }: { children: ReactNode }) {
  const [summaries, setSummaries] = useState<ModuleSummary[]>([]);

  const generateSummary = useCallback(async (module: string, answers: string[], userId?: string, childName?: string, childPronouns?: string) => {
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
      console.log("[ModuleSummariesContext] set to generating:", newSummaries);
      return newSummaries;
    });

    try {
      // Generate unique IDs for V2 system - include userId for account linking
      const userPrefix = userId ? `user-${userId}` : 'anonymous';
      const profileId = `${userPrefix}-${module}-${Date.now()}`;
      const runId = `${profileId}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log("Generating V2 summary for module:", module, "for user:", userId);
      
      // Call server-side V2 API
      const response = await fetch("/api/v2/summary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          module,
          answers, 
          runId, 
          profileId,
          userId, // Include userId for account linking
          childName,
          childPronouns,
          includeDocuments: true 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`V2 API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log("V2 summary generated and stored successfully");
        
        setSummaries(prev => {
          const newSummaries = [...prev];
          const index = newSummaries.findIndex(s => s.module === module);
          if (index >= 0) {
            newSummaries[index] = {
              module,
              summary: data.summary,
              status: "completed"
            };
          } else {
            newSummaries.push({ module, summary: data.summary, status: "completed" });
          }
          console.log("[ModuleSummariesContext] set to completed:", newSummaries);
          return newSummaries;
        });
        return data.summary;
      } else {
        throw new Error("V2 summary generation failed");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("V2 summary generation error:", error);
      
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
        console.log("[ModuleSummariesContext] set to error:", newSummaries);
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

  const loadSummariesFromProgress = useCallback(async (answers: Record<string, string[]>, userId?: string) => {
    if (!userId) return;
    
    try {
      // Get all summaries for this user from MongoDB
      const response = await fetch(`/api/v2/summaries?userId=${userId}`);
      const data = await response.json();
      
      if (data.success && data.summaries) {
        const loadedSummaries: ModuleSummary[] = [];
        
        // Process each summary from MongoDB
        for (const summaryData of data.summaries) {
          // Extract module name from profileId (format: user-{userId}-{module}-{timestamp})
          const profileIdParts = summaryData.profileId.split('-');
          if (profileIdParts.length >= 3) {
            const module = profileIdParts[2]; // The module name
            
            // Get the summary text from the first section
            const summaryText = summaryData.summary?.sections?.[Object.keys(summaryData.summary.sections)[0]]?.text || '';
            
            if (summaryText) {
              loadedSummaries.push({
                module,
                summary: summaryText,
                status: "completed"
              });
            }
          }
        }
        
        setSummaries(loadedSummaries);
        console.log("Loaded summaries from progress:", loadedSummaries);
      }
    } catch (error) {
      console.error("Failed to load summaries from progress:", error);
    }
  }, []);

  return (
    <ModuleSummariesContext.Provider value={{ summaries, generateSummary, getModuleSummary, resetSummaries, loadSummariesFromProgress }}>
      {children}
    </ModuleSummariesContext.Provider>
  );
}

export function useModuleSummaries() {
  const ctx = useContext(ModuleSummariesContext);
  if (!ctx) throw new Error("useModuleSummaries must be used within a ModuleSummariesProvider");
  return ctx;
} 