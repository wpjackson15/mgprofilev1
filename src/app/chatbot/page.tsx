import React from "react";

export default function ChatbotPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Conversation Wizard</h1>
      <p className="mb-6 text-center max-w-xl">
        This is where the chatbot-style conversation will guide parents through the 6 frameworks to build their child&apos;s strength-based profile. After each section, the profile preview will update.
      </p>
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        {/* Chatbot UI will go here */}
        <div className="text-gray-400 text-center">[Chatbot UI Placeholder]</div>
      </div>
    </main>
  );
} 