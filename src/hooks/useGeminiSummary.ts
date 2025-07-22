import { useState, useCallback } from "react";
import { generateGeminiSummary } from "@/services/gemini";

export function useGeminiSummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");

  const generate = useCallback(async (answers: string[], context?: string) => {
    setLoading(true);
    setError(null);
    setResult("");
    try {
      const summary = await generateGeminiSummary(answers, context);
      setResult(summary);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("Failed to generate summary");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult("");
    setError(null);
    setLoading(false);
  }, []);

  return { generate, loading, error, result, reset };
} 