"use client";
import ChatbotWizard from "./ChatbotWizard";
import ProfilePreview from "../profile-preview/ProfilePreview";
import AuthButton from "@/components/AuthButton";
import React, { useState, useEffect, useRef } from "react";
import { ModuleSummariesProvider } from "@/hooks/ModuleSummariesContext";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { MessageCircle, User as UserIcon } from "lucide-react";

export default function ChatbotPage() {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [clearChatSignal, setClearChatSignal] = useState(0);
  const chatbotRef = useRef<{ clearChat: () => void } | null>(null);

  useEffect(() => {
    // Check localStorage for prior acceptance
    try {
      const val = localStorage.getItem("mgp_terms_accepted");
      if (val === "true") setAccepted(true);
    } catch {}
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    setAccepted(true);
    try {
      localStorage.setItem("mgp_terms_accepted", "true");
    } catch {}
  };

  return (
    <ModuleSummariesProvider>
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Genius Profile</h1>
            <p className="text-gray-600">Discover your unique learning profile through guided conversations</p>
          </div>

          {/* Auth Button */}
          <div className="flex justify-end">
            <AuthButton />
          </div>

          {!accepted ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome to My Genius Profile</h2>
                <p className="text-gray-600 mb-6">
                  Start your journey to discover your unique learning profile and unlock your potential.
                </p>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => setChecked(e.target.checked)}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the <span className="underline cursor-not-allowed text-gray-500">Terms and Conditions (coming soon)</span>
                    </span>
                  </label>
                  
                  <button
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    disabled={!checked}
                    onClick={handleStart}
                  >
                    Start My Profile Journey
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chatbot Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Profile Conversation</h2>
                </div>
                <ChatbotWizard
                  ref={chatbotRef}
                  setAnswers={setAnswers}
                  user={user}
                  clearChatSignal={clearChatSignal}
                  onModuleComplete={(module, answers) => {
                    // This will trigger summary generation in the ProfilePreview
                    console.log(`Module ${module} completed with ${answers.length} answers`);
                  }}
                />
              </div>

              {/* Profile Preview Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <UserIcon className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Your Genius Profile</h2>
                </div>
                <ProfilePreview
                  answers={answers}
                  onClearChat={() => setClearChatSignal((sig) => sig + 1)}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </ModuleSummariesProvider>
  );
} 