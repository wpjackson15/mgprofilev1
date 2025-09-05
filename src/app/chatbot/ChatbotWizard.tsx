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

export default function ChatbotWizard({ user, setAnswers }: { user: any; setAnswers: React.Dispatch<React.SetStateAction<Record<string, string[]>>> }) {
  const { generateSummary } = useModuleSummaries();
  

  const [flow, setFlow] = useState<Module[]>([]);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [answers, setLocalAnswers] = useState<Record<string, string[]>>({});
  const [awaitingSummaryConsent, setAwaitingSummaryConsent] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [userContext, setUserContext] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Replace dynamic placeholders in text with user context values
  const replaceDynamicText = (text: string): string => {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return userContext[key] || match; // Return the original placeholder if not found
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation flow and user progress
  useEffect(() => {
    fetch("/conversationFlow.json")
      .then((res) => res.json())
      .then((data) => {
        setFlow(data);
        // Start with the first question
        if (data.length > 0 && data[0].steps.length > 0) {
          const firstQuestion = replaceDynamicText(data[0].steps[0].text);
          setMessages([
            { sender: "bot", text: firstQuestion },
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
      // Handle setup questions (like racial identity setup)
      if (currentModuleData.module === "Racial Identity Setup") {
        // Store the race in user context
        setUserContext(prev => ({ ...prev, race: text }));
        // Move to next step
        setTimeout(() => nextStep(), 500);
        return;
      }

      // Save answer to both local state and parent
      const key = `${currentModuleData.module}-${currentStep}`;
      const newAnswers = {
        ...answers,
        [key]: answers[key] ? [...answers[key], text] : [text],
      };
      setLocalAnswers(newAnswers);
      setAnswers(newAnswers);
      // Move to next step
      setTimeout(() => nextStep(), 500);
    } else if (step.type === "auto_summary") {
      // Auto-generate summary for completed module

      if (user && generateSummary) {
        // Collect ALL answers from this module
        const moduleAnswers = [];
        for (let i = 0; i < currentStep; i++) {
          const key = `${currentModuleData.module}-${i}`;
          if (answers[key]) {
            moduleAnswers.push(...answers[key]);
          }
        }

        if (moduleAnswers.length > 0) {
          setIsGeneratingSummary(true);
          generateSummary(currentModuleData.module, moduleAnswers)
            .then(() => {
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
          setTimeout(() => nextStep(), 1000);
        }
      } else {
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
      const nextStepText = replaceDynamicText(currentModuleData.steps[currentStep + 1].text);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: nextStepText },
      ]);
    } else if (currentModule + 1 < flow.length) {
      // Summary already generated in handleStepCompletion, just move to next module
      setCurrentModule(currentModule + 1);
      setCurrentStep(0);
      const nextModuleText = replaceDynamicText(flow[currentModule + 1].steps[0].text);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: nextModuleText },
      ]);
    } else {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Thank you! You've completed the conversation. You can now view or share your child's Genius Profile." },
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
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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