import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEmailSender } from "@/hooks/useEmailSender";
import { useProfileProgress } from "@/hooks/useProfileProgress";
import { useModuleSummaries } from "@/hooks/useModuleSummaries";
import ModuleProgressBar from "@/components/ModuleProgressBar";

interface ProfilePreviewProps {
  answers: Record<string, string[]>;
}

function generateSummaryText(answers: Record<string, string[]>): string {
  let summary = "My Genius Profile Summary\n\n";
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    summary += `--- ${module.replace(/-/g, " ")} ---\n`;
    value.forEach((resp, i) => {
      summary += `• ${resp}\n`;
    });
    summary += "\n";
  });
  return summary;
}

export default function ProfilePreview({ answers }: ProfilePreviewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { summaries, generateSummary, resetSummaries } = useModuleSummaries();
  
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const { send, isSending, error, success, reset: resetEmail } = useEmailSender();
  const { reset: resetProgress } = useProfileProgress();
  const [showConfirm, setShowConfirm] = useState(false);

  // Group answers by module for display
  const grouped: Record<string, string[]> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(...value);
  });

  // Get all unique modules from answers
  const modules = Array.from(new Set(Object.keys(answers).map(key => key.split("-")[0])));

  const handleEmailSummary = async () => {
    if (!user?.email) return;
    resetEmail();
    const summaryText = generateSummaryText(answers);
    await send({
      to: user.email,
      subject: "Your Genius Profile Summary",
      text: summaryText,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-2xl font-bold mb-4">Profile Preview</h2>
      <p className="mb-4 text-gray-600">
        This panel shows a real-time summary of your child’s strengths and story as you answer questions.
      </p>
      {Object.keys(grouped).length === 0 ? (
        <div className="text-gray-400 text-center mb-2">[Profile Preview Placeholder]</div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => {
            const moduleSummary = summaries.find(s => s.module === module);
            const moduleAnswers = grouped[module] || [];
            const hasAnswers = moduleAnswers.length > 0;
            
            // Calculate progress based on answers and summary status
            let progress = 0;
            let status: "idle" | "generating" | "completed" | "error" = "idle";
            
            if (hasAnswers) {
              progress = 50; // Base progress for having answers
              if (moduleSummary) {
                status = moduleSummary.status;
                if (status === "completed") {
                  progress = 100;
                } else if (status === "generating") {
                  progress = 75;
                } else if (status === "error") {
                  progress = 50;
                }
              }
            }

            return (
              <ModuleProgressBar
                key={module}
                module={module}
                status={status}
                summary={moduleSummary?.summary}
                error={moduleSummary?.error}
                progress={progress}
                onRetry={hasAnswers ? () => generateSummary(module, moduleAnswers) : undefined}
              />
            );
          })}
        </div>
      )}
      <div className="mt-6 flex flex-col items-center gap-2">
        {checkingAuth ? (
          <button className="px-4 py-2 bg-gray-300 rounded" disabled>Checking login...</button>
        ) : user ? (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleEmailSummary}
            disabled={isSending || success}
          >
            {isSending ? "Sending..." : success ? "Email Sent!" : "Email Summary"}
          </button>
        ) : (
          <div className="text-sm text-gray-600">Please log in to email your summary.</div>
        )}
        {showConfirm ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-gray-700">Are you sure you want to clear all progress?</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => { resetProgress(); resetSummaries(); setShowConfirm(false); }}>Yes, clear all</button>
              <button className="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition mt-2"
            onClick={() => setShowConfirm(true)}
          >
            Clear Chat and Start Over
          </button>
        )}
        {error && (
          <div className="text-xs text-red-600">
            {error} <button className="underline ml-2" onClick={resetEmail}>Retry</button>
          </div>
        )}
        {success && (
          <div className="text-xs text-green-600">Email sent! Check your inbox.</div>
        )}
      </div>
    </div>
  );
} 