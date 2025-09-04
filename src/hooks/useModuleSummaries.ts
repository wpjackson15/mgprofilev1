import { useState, useCallback } from "react";
import { ClaudeSummarizerV2 } from "../services/ClaudeSummarizerV2";

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
      // Generate unique IDs for V2 system
      const profileId = `profile-${module}-${Date.now()}`;
      const runId = `${profileId}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log("Generating V2 summary for module:", module);
      
      // Use V2 summarizer directly
      const summarizer = new ClaudeSummarizerV2({
        runId,
        profileId,
        includeDocuments: true, // Enable document reference
      });

      // Generate structured summary
      const v2Summary = await summarizer.generateSummary(module, answers);
      
      if (v2Summary) {
        // Update summary with proper metadata
        v2Summary.studentId = profileId;
        v2Summary.meta.runId = runId;
        v2Summary.meta.model = 'claude-sonnet-4-20250514';
        v2Summary.meta.createdAt = new Date().toISOString();

        // Store in database
        const success = await summarizer.finalizeSummary(v2Summary);
        
        if (success) {
          console.log("V2 summary generated and stored successfully");
          
          // Convert V2 summary to readable text for display
          const summaryText = v2Summary.sections 
            ? Object.entries(v2Summary.sections)
                .map(([element, section]) => {
                  const elementName = element.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return `${elementName}:\n${section.text}`;
                })
                .join('\n\n')
            : 'No sections available';

          // Update with completed status
          setSummaries(prev => {
            const newSummaries = [...prev];
            const index = newSummaries.findIndex(s => s.module === module);
            if (index >= 0) {
              newSummaries[index] = {
                module,
                summary: summaryText,
                status: "completed"
              };
            }
            return newSummaries;
          });

          return summaryText;
        } else {
          throw new Error("Failed to store V2 summary");
        }
      } else {
        throw new Error("Failed to generate V2 summary");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("V2 summary generation error:", error);
      
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