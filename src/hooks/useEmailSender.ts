import { useState, useCallback } from "react";
import { sendSummaryEmail, SendSummaryEmailParams } from "@/services/email";

export function useEmailSender() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const send = useCallback(async (params: SendSummaryEmailParams) => {
    setIsSending(true);
    setError(null);
    setSuccess(false);
    const result = await sendSummaryEmail(params);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Failed to send email");
    }
    setIsSending(false);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return { send, isSending, error, success, reset };
} 