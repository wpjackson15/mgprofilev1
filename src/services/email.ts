export interface SendSummaryEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendSummaryEmail({ to, subject, text, html }: SendSummaryEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/.netlify/functions/send-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, text, html }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to send email" };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
} Fu