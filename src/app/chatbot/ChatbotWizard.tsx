"use client";
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useModuleSummaries } from "@/hooks/ModuleSummariesContext";
import { CheckCircle } from "lucide-react";
import { useProfileProgress } from "@/hooks/useProfileProgress";

interface Step {
  type: "question" | "auto_summary";
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

interface ChatbotWizardProps {
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  onModuleComplete?: (module: string, answers: string[]) => void;
  user: import("firebase/auth").User | null;
  clearChatSignal?: number; // increment this prop to trigger chat clear
}

const ChatbotWizard = forwardRef(function ChatbotWizard({ setAnswers, onModuleComplete, clearChatSignal }: ChatbotWizardProps, ref) {
  const [flow, setFlow] = useState<Module[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { generateSummary } = useModuleSummaries();
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Use the custom hook for progress
  const { progress, save, user, loading } = useProfileProgress();

  // Local state mirrors progress for editing before save
  const [localAnswers, setLocalAnswers] = useState<Record<string, string[]>>({});
  const [currentModule, setCurrentModule] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Expose clearChat to parent if needed
  useImperativeHandle(ref, () => ({
    clearChat: () => setMessages([])
  }));

  // Clear chat when clearChatSignal changes
  useEffect(() => {
    setMessages([]);
    setLocalAnswers({});
    setCurrentModule(0);
    setCurrentStep(0);
    // After clearing, show the first question if flow is loaded
    if (flow.length > 0 && flow[0].steps.length > 0) {
      setMessages([{ sender: "bot", text: flow[0].steps[0].text }]);
    }
  }, [clearChatSignal]);

  // Load conversation flow
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
  }, []);

  // Improved chat history reconstruction
  useEffect(() => {
    if (progress && flow.length > 0) {
      setLocalAnswers(progress.answers || {});
      setAnswers(progress.answers || {});
      if (typeof progress.currentModule === 'number') setCurrentModule(progress.currentModule);
      if (typeof progress.lastStep === 'number') setCurrentStep(progress.lastStep);

      // Rebuild chat history up to current module/step, including user answers
      const rebuiltMessages: Message[] = [];
      for (let m = 0; m <= (progress.currentModule ?? 0); m++) {
        const moduleData = flow[m];
        if (!moduleData) continue;
        const lastStepInModule = m === (progress.currentModule ?? 0) ? (progress.lastStep ?? 0) : moduleData.steps.length - 1;
        for (let s = 0; s <= lastStepInModule; s++) {
          const step = moduleData.steps[s];
          if (!step) continue;
          // Add bot question/summary
          rebuiltMessages.push({ sender: "bot", text: step.text });
          // Add user answer(s) if question
          if (step.type === "question") {
            const key = `${moduleData.module}-${s}`;
            const answersArr = (progress.answers && progress.answers[key]) || [];
            for (const ans of answersArr) {
              rebuiltMessages.push({ sender: "user", text: ans });
            }
          }
        }
      }
      setMessages(rebuiltMessages);
    }
  }, [progress, flow, setAnswers]);

  // Regenerate summaries for completed modules on load
  useEffect(() => {
    if (
      progress &&
      flow.length > 0 &&
      generateSummary &&
      Object.keys(progress.answers || {}).length > 0
    ) {
      for (let m = 0; m <= (progress.currentModule ?? 0); m++) {
        const moduleData = flow[m];
        if (!moduleData) continue;
        // Collect all answers for this module
        const moduleAnswers: string[] = [];
        for (let s = 0; s < moduleData.steps.length; s++) {
          const step = moduleData.steps[s];
          if (step.type === "question") {
            const key = `${moduleData.module}-${s}`;
            const stepAnswers = (progress.answers && progress.answers[key]) || [];
            moduleAnswers.push(...stepAnswers);
          }
        }
        if (moduleAnswers.length > 0) {
          generateSummary(moduleData.module, moduleAnswers);
        }
      }
    }
  }, [progress, flow, generateSummary]);

  // Save progress to Firestore/localStorage on every answer or step change
  useEffect(() => {
    if (!user) return;
    if (isGeneratingSummary) return; // Prevent autosave during summary generation
    if (Object.keys(localAnswers).length === 0 && currentStep === 0 && currentModule === 0) return;
    save({
      answers: localAnswers,
      currentModule,
      lastStep: currentStep,
      updatedAt: new Date().toISOString(),
    }).then(() => {
      setShowSaved(true);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setShowSaved(false), 2000);
    });
  }, [localAnswers, currentStep, currentModule, user, save, isGeneratingSummary]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  // Autoscroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };
    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Handle sending a message
  const sendMessage = (text: string) => {
    if (!flow.length) return;
    const currentModuleData = flow[currentModule];
    const step = currentModuleData.steps[currentStep];
    setMessages((msgs) => [...msgs, { sender: "user", text }]);
    setInput("");

    if (step.type === "question") {
      // Save answer
      const key = `${currentModuleData.module}-${currentStep}`;
      const newAnswers = {
        ...localAnswers,
        [key]: localAnswers[key] ? [...localAnswers[key], text] : [text],
      };
      setLocalAnswers(newAnswers);
      setAnswers(newAnswers);
      // Check if next step is auto_summary (i.e., last question in module)
      if (
        currentStep + 1 < currentModuleData.steps.length &&
        currentModuleData.steps[currentStep + 1].type === "auto_summary"
      ) {
        setTimeout(() => nextStep(), 500); // Advance to summary step
        setTimeout(() => handleSummaryConsent("yes"), 600); // Trigger summary after advancing
      } else {
        // Move to next step
        setTimeout(() => nextStep(), 500);
      }
    } else if (step.type === "auto_summary") {
      // Do not trigger summary here; it is handled after last question
    }
  };

  // Handle summary generation - now automatically triggered
  const handleSummaryConsent = async (text: string) => {
    setMessages((msgs) => [...msgs, { sender: "user", text }]);
    const currentModuleData = flow[currentModule];
    const moduleAnswers: string[] = [];
    for (let i = 0; i < currentStep; i++) {
      const step = currentModuleData.steps[i];
      if (step.type === "question") {
        const key = `${currentModuleData.module}-${i}`;
        const stepAnswers = localAnswers[key] || [];
        moduleAnswers.push(...stepAnswers);
      }
    }
    if (moduleAnswers.length > 0) {
      setIsGeneratingSummary(true);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Generating a summary of your responses..." },
      ]);
      try {
        await generateSummary(currentModuleData.module, moduleAnswers);
        if (onModuleComplete) {
          onModuleComplete(currentModuleData.module, moduleAnswers);
        }
      } catch {
        setMessages((msgs) => [
          ...msgs,
          { sender: "bot", text: "Sorry, I couldn't generate a summary right now. You can continue and we'll try again later." },
        ]);
      } finally {
        setIsGeneratingSummary(false);
      }
    } else {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "I don't have enough information to generate a summary yet. Let's continue with the questions." },
      ]);
    }
    setTimeout(() => nextStep(true), 2000);
    setInput("");
  };

  // Move to next step or module
  const nextStep = (skipAutoSummary = false) => {
    if (!flow.length) return;
    const currentModuleData = flow[currentModule];
    if (currentStep + 1 < currentModuleData.steps.length) {
      const nextStepObj = currentModuleData.steps[currentStep + 1];
      if (nextStepObj.type === "auto_summary" && skipAutoSummary) {
        if (currentModule + 1 < flow.length) {
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
        return;
      }
      setCurrentStep(currentStep + 1);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: nextStepObj.text },
      ]);
      // Removed summary trigger from here
    } else if (currentModule + 1 < flow.length) {
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
    if (!input.trim() || isGeneratingSummary) return;
    if (input.trim().toLowerCase() === "yes") {
      handleSummaryConsent(input);
    } else {
      sendMessage(input);
    }
    inputRef.current?.focus();
  };

  if (loading) {
    return <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4 flex flex-col h-[70vh] items-center justify-center text-gray-600">Loading your progress...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4 flex flex-col h-[70vh]">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      {user && showSaved && (
        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-100 border border-green-300 rounded px-3 py-2 mb-2 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium">Progress saved!</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring text-gray-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isGeneratingSummary ? "Yes or No" : "Type your answer..."}
          disabled={!flow.length}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          disabled={!input.trim() || !flow.length || isGeneratingSummary}
        >
          {isGeneratingSummary ? "Generating..." : "Send"}
        </button>
      </form>
    </div>
  );
});

export default ChatbotWizard; 