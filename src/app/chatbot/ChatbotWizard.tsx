"use client";
import React, { useState, useEffect, useRef } from "react";

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

interface ChatbotWizardProps {
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

export default function ChatbotWizard({ setAnswers }: ChatbotWizardProps) {
  const [flow, setFlow] = useState<Module[]>([]);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [awaitingSummaryConsent, setAwaitingSummaryConsent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Add a ref for the chat container
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
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
      setAnswers((prev) => {
        return {
          ...prev,
          [key]: prev[key] ? [...prev[key], text] : [text],
        };
      });
      // Move to next step
      setTimeout(() => nextStep(), 500);
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
      // Advance to next step after showing summary
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
    <div ref={chatContainerRef} className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4 flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto mb-2">
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={!input.trim() || !flow.length}
        >
          Send
        </button>
      </form>
    </div>
  );
} 