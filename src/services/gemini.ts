export async function generateGeminiSummary(answers: string[], context?: string): Promise<string> {
  const res = await fetch("/.netlify/functions/generate-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, context }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  const data = await res.json();
  return data.summary || "";
} 