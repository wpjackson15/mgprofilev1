"use client";
import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEmailSender } from "@/hooks/useEmailSender";
import { useProfileProgress } from "@/hooks/useProfileProgress";
import { useModuleSummaries } from "@/hooks/ModuleSummariesContext";
import ModuleProgressBar from "@/components/ModuleProgressBar";

interface ProfilePreviewProps {
  answers: Record<string, string[]>;
  onClearChat?: () => void;
}

function generateLLMSummaryEmail(summaries: { module: string; summary: string }[], answers: Record<string, string[]>) {
  let email = "My Genius Profile (LLM Summaries)\n\n";
  summaries.forEach(({ module, summary }) => {
    if (summary && summary.trim()) {
      email += `--- ${module} ---\n`;
      email += summary + "\n\n";
    }
  });
  if (Object.keys(answers).length > 0) {
    email += "\n\n--- Appendix: Raw Responses ---\n";
    Object.entries(answers).forEach(([key, value]) => {
      const [module] = key.split("-");
      email += `--- ${module.replace(/-/g, " ")} ---\n`;
      value.forEach((resp) => {
        email += `• ${resp}\n`;
      });
      email += "\n";
    });
  }
  return email;
}

type ConversationStep = { type: string; text: string };
type ConversationModule = { module: string; steps: ConversationStep[] };

export default function ProfilePreview({ answers }: ProfilePreviewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { summaries, generateSummary } = useModuleSummaries();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const { send, isSending, error, success, reset: resetEmail } = useEmailSender();

  // Group answers by module
  const grouped: Record<string, string[]> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push(...value);
  });

  // Load conversation flow
  const [flow, setFlow] = useState<ConversationModule[]>([]);
  useEffect(() => {
    fetch("/conversationFlow.json")
      .then((res) => res.json())
      .then((data) => setFlow(data))
      .catch((err) => console.error("Failed to load conversation flow:", err));
  }, []);

  // Get module display names and question counts
  const moduleDisplayNames: Record<string, string> = {};
  const moduleQuestionCounts: Record<string, number> = {};
  flow.forEach((moduleData) => {
    moduleDisplayNames[moduleData.module] = moduleData.module.replace(/-/g, " ");
    moduleQuestionCounts[moduleData.module] = moduleData.steps.filter((step) => step.type === "question").length;
  });

  const modules = Object.keys(grouped).sort((a, b) => {
    const aIndex = flow.findIndex((m) => m.module === a);
    const bIndex = flow.findIndex((m) => m.module === b);
    return aIndex - bIndex;
  });

  const handleEmailSummary = async () => {
    const summaryText = generateLLMSummaryEmail(summaries, answers);
    await send({
      to: user?.email || "",
      subject: "Your Genius Profile Summary",
      text: summaryText,
    });
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto relative">
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          This panel shows a real-time summary of your child&apos;s strengths and story as you answer questions.
        </p>
        
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📝</span>
            </div>
            <p className="text-gray-500 text-lg mb-2">No profile data yet</p>
            <p className="text-gray-400">Start answering questions to see your profile summary</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {modules.map((module, index) => {
              // Use the canonical module name from the config for all logic
              const displayName = moduleDisplayNames[module] || module;
              // Log displayName and summaries before lookup
              console.log(`[SummaryLookup] displayName: '${displayName}'`, summaries);
              const moduleSummary = summaries.find(
                s => s.module === displayName
              );
              const moduleAnswers = grouped[module] || [];
              const hasAnswers = moduleAnswers.length > 0;
              const totalQuestions = moduleQuestionCounts[module] || 1;
              // Calculate progress based on answers and summary status
              let progress = 0;
              let status: "idle" | "generating" | "completed" | "error" = "idle";
              if (hasAnswers) {
                progress = Math.min((moduleAnswers.length / totalQuestions) * 100, 99); // Don't show 100% until summary is done
                if (moduleSummary) {
                  status = moduleSummary.status;
                  if (status === "completed") {
                    progress = 100;
                  } else if (status === "generating") {
                    progress = 99;
                  } else if (status === "error") {
                    progress = Math.min((moduleAnswers.length / totalQuestions) * 100, 99);
                  }
                }
              }
              // Debug: log progress bar props
              console.log(`[ProgressBar] ${displayName}: progress=${progress}, status=${status}, summary=`, moduleSummary?.summary);
              
              return (
                <div key={module}>
                  {/* Email button - only show above the first summary */}
                  {index === 0 && (
                    <div className="mb-4">
                      {checkingAuth ? (
                        <button className="w-full px-4 py-2 bg-gray-300 rounded-lg text-gray-600 text-sm" disabled>
                          Checking login...
                        </button>
                      ) : user ? (
                        <button
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm"
                          onClick={handleEmailSummary}
                          disabled={isSending || success}
                        >
                          {isSending ? "Sending..." : success ? "Email Sent!" : "Email Summary"}
                        </button>
                      ) : (
                        <div className="text-sm text-gray-600 text-center">Please log in to email your summary.</div>
                      )}
                      
                      {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
                          {error} <button className="underline ml-2" onClick={resetEmail}>Retry</button>
                        </div>
                      )}
                      {success && (
                        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2 text-center">
                          Email sent! Check your inbox.
                        </div>
                      )}
                    </div>
                  )}
                  
                  <ModuleProgressBar
                    module={displayName}
                    status={status}
                    summary={moduleSummary?.summary}
                    error={moduleSummary?.error}
                    progress={progress}
                    onRetry={hasAnswers ? () => generateSummary(displayName, moduleAnswers) : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}
        
        {/* Light demarcation line at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>
    </div>
  );
} 