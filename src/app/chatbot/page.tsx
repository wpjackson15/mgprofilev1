"use client";
import ChatbotWizard from "./ChatbotWizard";
import ProfilePreview from "../profile-preview/ProfilePreview";
import AuthButton from "@/components/AuthButton";
import React, { useState, useEffect } from "react";
import { ModuleSummariesProvider } from "@/hooks/ModuleSummariesContext";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ChatbotPage() {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
      <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <div className="w-full flex justify-end mb-4">
          <AuthButton />
        </div>
        <h1 className="text-3xl font-bold mb-4">My Genius Profile</h1>
        {!accepted ? (
          <div className="bg-white rounded-lg shadow p-6 max-w-md w-full flex flex-col items-center">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">
                I agree to the <span className="underline cursor-not-allowed text-gray-500">Terms and Conditions (coming soon)</span>
              </span>
            </label>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              disabled={!checked}
              onClick={handleStart}
            >
              Start
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-5xl">
            <div className="flex-1">
              <ChatbotWizard 
                setAnswers={setAnswers} 
                user={user}
                onModuleComplete={(module, answers) => {
                  // This will trigger summary generation in the ProfilePreview
                  console.log(`Module ${module} completed with ${answers.length} answers`);
                }}
              />
            </div>
            <div className="flex-1">
              <ProfilePreview answers={answers} />
            </div>
          </div>
        )}
      </main>
    </ModuleSummariesProvider>
  );
} 