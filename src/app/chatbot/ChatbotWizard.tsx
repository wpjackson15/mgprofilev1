"use client";
import React, { useState, useEffect, useRef } from "react";
import { useModuleSummaries } from "@/hooks/ModuleSummariesContext";
import { saveUserProgress, loadUserProgress } from "@/services/firestore";

interface Step {
  type: "question" | "offer_summary";
  text: string;
}

interface Module {
  module: string;
  steps: Step[];
}

interface Message {
  sender: "bot" | "user";
  text: string;
}

export default function ChatbotWizard({ user }: { user: any }) {
  const { generateSummary } = useModuleSummaries();
  
  // Debug: Check if generateSummary is available (only once on mount)
  useEffect(() => {
    console.log("ChatbotWizard mounted - generateSummary available:", !!generateSummary);
  }, []);
  const [flow, setFlow] = useState<Module[]>([]);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [awaitingSummaryConsent, setAwaitingSummaryConsent] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation flow and user progress
  useEffect(() => {
    fetch("/conversationFlow.json")
      .then((res) => res.json())
      .then((data) => {
        setFlow(data);
        // Start with the first question
        if (data.length > 0 && data[0].steps.length > 0) {
          setMessages([
            { sender: "bot", text: data[0].steps[0].text },
          ]);
        }
      });

    // Load user progress if logged in
    if (user) {
      loadUserProgress(user.uid)
        .then((progress) => {
          if (progress) {
            setAnswers(progress.answers || {});
            setCurrentModule(progress.lastStep || 0);
          }
        })
        .catch((err) => {
          console.warn("Failed to load user progress from Firebase, trying localStorage:", err);
          // Fallback to localStorage
          try {
            const localProgress = localStorage.getItem(`mgp_profile_progress_${user.uid}`);
            if (localProgress) {
              const parsed = JSON.parse(localProgress);
              setAnswers(parsed.answers || {});
              setCurrentModule(parsed.lastStep || 0);
            }
          } catch (localErr) {
            console.warn("LocalStorage fallback also failed:", localErr);
          }
        });
    }
  }, [user]);

  // Handle sending a message
  const sendMessage = (text: string) => {
    if (!flow.length) return;
    const currentModuleData = flow[currentModule];
    const step = currentModuleData.steps[currentStep];
    setMessages((msgs) => [...msgs, { sender: "user", text }]);
    setInput("");

    if (step.type === "question") {
      console.log("User answered question:", { step: currentStep, text, module: currentModuleData.module });
      
      // Save answer
      setAnswers((prev) => {
        const key = `${currentModuleData.module}-${currentStep}`;
        return {
          ...prev,
          [key]: prev[key] ? [...prev[key], text] : [text],
        };
      });
      // Move to next step
      setTimeout(() => nextStep(), 500);
    } else if (step.type === "auto_summary") {
      // Auto-generate summary for completed module
      console.log("Auto-generating summary for module:", currentModuleData.module);
      if (user && generateSummary) {
        // Collect ALL answers from this module
        const moduleAnswers = [];
        for (let i = 0; i < currentStep; i++) {
          const key = `${currentModuleData.module}-${i}`;
          if (answers[key]) {
            moduleAnswers.push(...answers[key]);
          }
        }
        console.log("Collected module answers:", moduleAnswers);
        if (moduleAnswers.length > 0) {
          setIsGeneratingSummary(true);
          generateSummary(currentModuleData.module, moduleAnswers)
            .then(() => {
              console.log("Summary generated successfully");
              setIsGeneratingSummary(false);
              // Move to next step after summary
              setTimeout(() => nextStep(), 1000);
            })
            .catch((err) => {
              console.error("Failed to generate summary:", err);
              setIsGeneratingSummary(false);
              // Move to next step even if summary fails
              setTimeout(() => nextStep(), 1000);
            });
        } else {
          console.log("No answers to generate summary from, moving to next step");
          setTimeout(() => nextStep(), 1000);
        }
      } else {
        console.log("Cannot generate summary, moving to next step");
        setTimeout(() => nextStep(), 1000);
      }
    } else if (step.type === "offer_summary") {
      // Expect yes/no
      setAwaitingSummaryConsent(true);
    }
  };

  // Handle summary consent
  const handleSummaryConsent = (text: string) => {
    setMessages((msgs) => [...msgs, { sender: "user", text }]);
    setAwaitingSummaryConsent(false);
    if (text.trim().toLowerCase().startsWith("y")) {
      // Placeholder summary
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "[Summary placeholder: This is where a brief, affirming summary for the teacher will appear.]" },
      ]);
      setTimeout(() => nextStep(), 1000);
    } else {
      setTimeout(() => nextStep(), 500);
    }
    setInput("");
  };

  // Move to next step or module
  const nextStep = () => {
    if (!flow.length) return;
    const currentModuleData = flow[currentModule];
    if (currentStep + 1 < currentModuleData.steps.length) {
      setCurrentStep(currentStep + 1);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: currentModuleData.steps[currentStep + 1].text },
      ]);
    } else if (currentModule + 1 < flow.length) {
      // Generate summary for completed module
      if (user && generateSummary) {
        const moduleAnswers = answers[`${currentModuleData.module}-${currentStep}`] || [];
        console.log("Attempting to generate summary:", {
          module: currentModuleData.module,
          step: currentStep,
          answers: moduleAnswers,
          generateSummary: !!generateSummary
        });
        if (moduleAnswers.length > 0) {
          setIsGeneratingSummary(true);
          generateSummary(currentModuleData.module, moduleAnswers)
            .then(() => {
              console.log("Summary generated successfully");
              setIsGeneratingSummary(false);
            })
            .catch((err) => {
              console.error("Failed to generate summary:", err);
              setIsGeneratingSummary(false);
            });
        } else {
          console.log("No answers to generate summary from");
        }
      } else {
        console.log("Cannot generate summary:", { user: !!user, generateSummary: !!generateSummary });
      }

      setCurrentModule(currentModule + 1);
      setCurrentStep(0);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: flow[currentModule + 1].steps[0].text },
      ]);
    } else {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Thank you! You’ve completed the conversation. You can now view or share your child’s Genius Profile." },
      ]);
    }
  };

  // Handle input submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (awaitingSummaryConsent) {
      handleSummaryConsent(input);
    } else {
      sendMessage(input);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4 flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
              {msg.text}
            </div>
          </div>
                          ))}
                </div>
                
                {/* Summary Generation Popup */}
                {isGeneratingSummary && (
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700">Generating summary...</span>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={awaitingSummaryConsent ? "Yes or No" : "Type your answer..."}
          disabled={!flow.length || isGeneratingSummary}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={!input.trim() || !flow.length || isGeneratingSummary}
        >
          Send
        </button>
      </form>
    </div>
  );
} 