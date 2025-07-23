"use client";
import React, { useState, useEffect, useRef } from "react";
import { useModuleSummaries } from "@/hooks/useModuleSummaries";

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
}

export default function ChatbotWizard({ setAnswers, onModuleComplete }: ChatbotWizardProps) {
  const [flow, setFlow] = useState<Module[]>([]);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [awaitingSummaryConsent, setAwaitingSummaryConsent] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  // Add a ref for the chat container
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { generateSummary } = useModuleSummaries();

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

  // Autoscroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };
    
    // Scroll immediately
    scrollToBottom();
    
    // Also scroll after a small delay to ensure content is rendered
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
      // Move to next step
      setTimeout(() => nextStep(), 500);
    } else if (step.type === "auto_summary") {
      // Automatically generate summary
      handleSummaryConsent("yes");
    }
  };

  // Handle summary generation - now automatically triggered
  const handleSummaryConsent = async (text: string) => {
    const userResponse = text.trim().toLowerCase();
    
    setMessages((msgs) => [...msgs, { sender: "user", text }]);
    
    // Always generate summary automatically (no need to ask)
    const currentModuleData = flow[currentModule];
    const moduleAnswers: string[] = [];
    
    // Collect all answers for this module
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
      
      // Show generating message
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Generating a summary of your responses..." },
      ]);

      try {
        // Generate summary
        const summary = await generateSummary(currentModuleData.module, moduleAnswers);
        
        // Show the summary
        setMessages((msgs) => [
          ...msgs,
          { sender: "bot", text: summary },
        ]);

        // Notify parent component
        if (onModuleComplete) {
          onModuleComplete(currentModuleData.module, moduleAnswers);
        }
      } catch (error) {
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
    
    // Advance to next step after showing summary
    setTimeout(() => nextStep(), 2000);
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
    if (awaitingSummaryConsent) {
      handleSummaryConsent(input);
    } else {
      sendMessage(input);
    }
    inputRef.current?.focus();
  };

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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring text-gray-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={awaitingSummaryConsent ? "Yes or No" : "Type your answer..."}
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
} 