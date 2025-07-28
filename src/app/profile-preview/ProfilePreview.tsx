import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEmailSender } from "@/hooks/useEmailSender";
import { useProfileProgress } from "@/hooks/useProfileProgress";
import { useModuleSummaries } from "@/hooks/ModuleSummariesContext";
import { useResourceMatches } from "@/hooks/useResourceMatches";
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
  // Optionally, add raw responses as appendix
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

export default function ProfilePreview({ answers, onClearChat }: ProfilePreviewProps) {
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
  const { resources, loading: resourcesLoading, error: resourcesError } = useResourceMatches();

  // Group answers by module for display
  const grouped: Record<string, string[]> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(...value);
  });

  // Get all unique modules from answers
  const modules = Array.from(new Set(Object.keys(answers).map(key => key.split("-")[0])));

  // Get total questions and display names per module from conversation flow
  const [moduleQuestionCounts, setModuleQuestionCounts] = useState<Record<string, number>>({});
  const [moduleDisplayNames, setModuleDisplayNames] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/conversationFlow.json")
      .then(res => res.json())
      .then((data: ConversationModule[]) => {
        const counts: Record<string, number> = {};
        const names: Record<string, string> = {};
        data.forEach((mod: ConversationModule) => {
          counts[mod.module] = mod.steps.filter((s: ConversationStep) => s.type === "question").length;
          names[mod.module.toLowerCase().replace(/[^a-z0-9]/gi, "")] = mod.module;
        });
        setModuleQuestionCounts(counts);
        setModuleDisplayNames(names);
      });
  }, []);

  // Debug: log summaries and progress bar props
  useEffect(() => {
    console.log("[ProfilePreview] summaries:", summaries);
  }, [summaries]);

  const handleEmailSummary = async () => {
    if (!user?.email) return;
    resetEmail();
    // Use LLM summaries for the email
    const summaryText = generateLLMSummaryEmail(summaries, answers);
    await send({
      to: user.email,
      subject: "Your Genius Profile Summary",
      text: summaryText,
    });
  };

  return (
    <div className="flex flex-col h-[600px]">
      <p className="mb-4 text-gray-600">
        This panel shows a real-time summary of your child’s strengths and story as you answer questions.
      </p>
      {Object.keys(grouped).length === 0 ? (
        <div className="text-gray-400 text-center mb-2">[Profile Preview Placeholder]</div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => {
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
              <ModuleProgressBar
                key={module}
                module={displayName}
                status={status}
                summary={moduleSummary?.summary}
                error={moduleSummary?.error}
                progress={progress}
                onRetry={hasAnswers ? () => generateSummary(displayName, moduleAnswers) : undefined}
              />
            );
          })}
        </div>
      )}
      

        {checkingAuth ? (
          <button className="w-full px-4 py-3 bg-gray-300 rounded-lg text-gray-600" disabled>
            Checking login...
          </button>
        ) : user ? (
          <button
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            onClick={handleEmailSummary}
            disabled={isSending || success}
          >
            {isSending ? "Sending..." : success ? "Email Sent!" : "Email Summary"}
          </button>
        ) : (
          <div className="text-sm text-gray-600 text-center">Please log in to email your summary.</div>
        )}
        
        {showConfirm ? (
          <div className="space-y-3">
            <span className="text-sm text-gray-700 text-center block">Are you sure you want to clear all progress?</span>
            <div className="flex gap-3">
              <button 
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium" 
                onClick={() => { resetProgress(); resetSummaries(); setShowConfirm(false); if (onClearChat) onClearChat(); }}
              >
                Yes, clear all
              </button>
              <button 
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium" 
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            onClick={() => setShowConfirm(true)}
          >
            Clear Chat and Start Over
          </button>
        )}
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error} <button className="underline ml-2" onClick={resetEmail}>Retry</button>
          </div>
        )}
        {success && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
            Email sent! Check your inbox.
          </div>
        )}
      </div>
      {/* Recommended Resources Section */}
      <div className="mt-8 w-full">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-center text-sm font-medium">
          When you finish, you’ll unlock local resources matched to your child’s Genius Profile!
        </div>
        <h3 className="text-lg font-semibold mb-2 text-green-700">Recommended Local Resources</h3>
        {resourcesLoading ? (
          <div className="text-gray-500 text-sm">Loading resources...</div>
        ) : resourcesError ? (
          <div className="text-red-500 text-sm">{resourcesError}</div>
        ) : resources.length === 0 ? (
          <div className="text-gray-500 text-sm">No matches yet. Complete your profile to unlock local resources!</div>
        ) : (
          <ul className="space-y-4">
            {resources.slice(0, 5).map((res) => (
              <li key={res.url} className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-green-900">{res.name}</span>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">{res.category}</span>
                </div>
                <div className="text-gray-700 text-sm mt-1">{res.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {res.city && res.state ? `${res.city}, ${res.state}` : ""}
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-green-700 underline text-xs"
                >
                  Visit Website
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 