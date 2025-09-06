"use client";
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useModuleSummaries } from "@/hooks/ModuleSummariesContext";
import { saveUserProgress, loadUserProgress } from "@/services/firestore";
import { SummaryHandoffService } from "@/services/summaryHandoffService";
import { extractChildInfo } from "@/lib/chatbotUtils";

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
  user: any;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  clearChatSignal?: number;
  onModuleComplete?: (module: string, answers: string[]) => void;
}

const ChatbotWizard = forwardRef<{ clearChat: () => void }, ChatbotWizardProps>(
  ({ user, setAnswers, clearChatSignal = 0, onModuleComplete }, ref) => {
  const { generateSummary, loadSummariesFromProgress } = useModuleSummaries();
  

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change (only within chatbot container)
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Replace dynamic placeholders in text with user context values
  const replaceDynamicText = (text: string): string => {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return userContext[key] || match; // Return the original placeholder if not found
    });
  };

  // Save progress to Firebase and localStorage
  const saveProgress = async (answersToSave: Record<string, string[]>, currentModuleIndex: number) => {
    // Extract child information using utility function
    const { name: childName, pronouns: childPronounsText } = extractChildInfo(answersToSave);

    const progressData = {
      answers: answersToSave,
      lastStep: currentModuleIndex,
      currentModule: currentModuleIndex,
      updatedAt: new Date().toISOString(),
      childName,
      childPronouns: childPronounsText,
    };

    if (user) {
      try {
        await saveUserProgress(user.uid, progressData);
        console.log("Progress saved to Firebase:", progressData);
      } catch (err) {
        console.warn("Failed to save progress to Firebase:", err);
        // Fallback to localStorage
        try {
          localStorage.setItem(`mgp_profile_progress_${user.uid}`, JSON.stringify(progressData));
          console.log("Progress saved to localStorage as fallback:", progressData);
        } catch (localErr) {
          console.error("Failed to save progress to localStorage:", localErr);
        }
      }
    } else {
      // Save to localStorage for anonymous users
      try {
        localStorage.setItem("mgp_profile_progress_anonymous", JSON.stringify(progressData));
        console.log("Progress saved to localStorage for anonymous user:", progressData);
      } catch (localErr) {
        console.error("Failed to save progress to localStorage:", localErr);
      }
    }
  };

  // Clear all progress and reset chat
  const clearChat = () => {
    const emptyAnswers = {};
    setLocalAnswers(emptyAnswers);
    setAnswers(emptyAnswers);
    setCurrentModule(0);
    setCurrentStep(0);
    setMessages([]);
    setUserContext({});
    setAwaitingSummaryConsent(false);
    setIsGeneratingSummary(false);
    
    // Clear saved progress
    if (user) {
      try {
        localStorage.removeItem(`mgp_profile_progress_${user.uid}`);
        // Also clear from Firebase
        saveUserProgress(user.uid, {
          answers: {},
          lastStep: 0,
          currentModule: 0,
          updatedAt: new Date().toISOString(),
        }).catch(err => console.warn("Failed to clear Firebase progress:", err));
      } catch (err) {
        console.warn("Failed to clear localStorage progress:", err);
      }
    } else {
      try {
        localStorage.removeItem("mgp_profile_progress_anonymous");
      } catch (err) {
        console.warn("Failed to clear localStorage progress:", err);
      }
    }
    
    // Restart conversation
    if (flow.length > 0 && flow[0].steps.length > 0) {
      const firstQuestion = replaceDynamicText(flow[0].steps[0].text);
      setMessages([{ sender: "bot", text: firstQuestion }]);
    }
    
    console.log("Chat cleared and reset");
  };

  // Expose clearChat function via ref
  useImperativeHandle(ref, () => ({
    clearChat
  }));

  // Handle clear chat signal from parent
  useEffect(() => {
    if (clearChatSignal > 0) {
      clearChat();
    }
  }, [clearChatSignal]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation flow and user progress
  useEffect(() => {
    let flowData: any[] = [];
    
    fetch("/conversationFlow.json")
      .then((res) => res.json())
      .then((data) => {
        flowData = data;
        setFlow(data);
        
        // Load user progress if logged in
        if (user) {
          loadUserProgress(user.uid)
            .then((progress) => {
              if (progress) {
                const loadedAnswers = progress.answers || {};
                setLocalAnswers(loadedAnswers);
                setAnswers(loadedAnswers); // Sync with parent
                setCurrentModule(progress.lastStep || 0);
                console.log("Loaded user progress from Firebase:", progress);
                
                // Reconstruct conversation history from loaded progress
                reconstructConversationFromProgress(loadedAnswers, progress.lastStep || 0, data);
                
                // Load summaries from MongoDB
                loadSummariesFromProgress(loadedAnswers, user.uid);
              } else {
                // No progress found, start with first question
                if (data.length > 0 && data[0].steps.length > 0) {
                  const firstQuestion = replaceDynamicText(data[0].steps[0].text);
                  setMessages([
                    { sender: "bot", text: firstQuestion },
                  ]);
                }
              }
            })
            .catch((err) => {
              console.warn("Failed to load user progress from Firebase, trying localStorage:", err);
              // Fallback to localStorage
              try {
                const localProgress = localStorage.getItem(`mgp_profile_progress_${user.uid}`);
                if (localProgress) {
                  const parsed = JSON.parse(localProgress);
                  const loadedAnswers = parsed.answers || {};
                  setLocalAnswers(loadedAnswers);
                  setAnswers(loadedAnswers); // Sync with parent
                  setCurrentModule(parsed.lastStep || 0);
                  console.log("Loaded user progress from localStorage:", parsed);
                  
                  // Reconstruct conversation history from loaded progress
                  reconstructConversationFromProgress(loadedAnswers, parsed.lastStep || 0, data);
                  
                  // Load summaries from MongoDB
                  loadSummariesFromProgress(loadedAnswers, user.uid);
                } else {
                  // No progress found, start with first question
                  if (data.length > 0 && data[0].steps.length > 0) {
                    const firstQuestion = replaceDynamicText(data[0].steps[0].text);
                    setMessages([
                      { sender: "bot", text: firstQuestion },
                    ]);
                  }
                }
              } catch (localErr) {
                console.warn("LocalStorage fallback also failed:", localErr);
                // Start with first question as fallback
                if (data.length > 0 && data[0].steps.length > 0) {
                  const firstQuestion = replaceDynamicText(data[0].steps[0].text);
                  setMessages([
                    { sender: "bot", text: firstQuestion },
                  ]);
                }
              }
            });
        } else {
          // No user, start with first question
          if (data.length > 0 && data[0].steps.length > 0) {
            const firstQuestion = replaceDynamicText(data[0].steps[0].text);
            setMessages([
              { sender: "bot", text: firstQuestion },
            ]);
          }
        }
      });
  }, [user, setAnswers]);

  // Reconstruct conversation history from loaded progress
  const reconstructConversationFromProgress = (loadedAnswers: Record<string, string[]>, lastStep: number, flowData: any[]) => {
    if (!flowData.length) return;
    
    const conversationMessages: Message[] = [];
    
    // Go through each module and step to rebuild the conversation
    for (let moduleIndex = 0; moduleIndex <= lastStep && moduleIndex < flowData.length; moduleIndex++) {
      const moduleData = flowData[moduleIndex];
      
      for (let stepIndex = 0; stepIndex < moduleData.steps.length; stepIndex++) {
        const step = moduleData.steps[stepIndex];
        const answerKey = `${moduleData.module}-${stepIndex}`;
        const answers = loadedAnswers[answerKey] || [];
        
        // Add the bot's question
        const questionText = replaceDynamicText(step.text);
        conversationMessages.push({
          sender: "bot",
          text: questionText
        });
        
        // Add the user's answers
        answers.forEach(answer => {
          conversationMessages.push({
            sender: "user",
            text: answer
          });
        });
      }
    }
    
    // Set the reconstructed conversation
    setMessages(conversationMessages);
    console.log("Reconstructed conversation with", conversationMessages.length, "messages");
  };

  // Handle sending a message
  const sendMessage = (text: string) => {
    if (!flow.length) return;
    const currentModuleData = flow[currentModule];
    const step = currentModuleData.steps[currentStep];
    setMessages((msgs) => [...msgs, { sender: "user", text }]);
    setInput("");

    if (step.type === "question") {
      // Handle setup questions (like racial identity setup - first question in Racial Identity module)
      if (currentModuleData.module === "Racial Identity" && currentStep === 0) {
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
      
      // Save progress after updating answers
      saveProgress(newAnswers, currentModule);
      
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
          // Get child information using utility function
          const { name: childName, pronouns: childPronouns } = extractChildInfo(answers);
          
          generateSummary(currentModuleData.module, moduleAnswers, user?.uid, childName, childPronouns)
            .then(async (summaryText) => {
              // Handle Firebase-MongoDB handoff if user is logged in
              if (user?.uid && summaryText) {
                const handoffResult = await SummaryHandoffService.processSummaryHandoff(
                  user.uid,
                  currentModuleData.module,
                  summaryText
                );
                
                if (!handoffResult.success) {
                  console.warn("Summary handoff failed:", handoffResult.error);
                }
              }
              
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto mb-2">
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
});

ChatbotWizard.displayName = 'ChatbotWizard';

export default ChatbotWizard; 