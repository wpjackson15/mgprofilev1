import React from "react";

export default function ProfilePreviewPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Profile Preview</h1>
      <p className="mb-6 text-center max-w-xl">
        This page will show a real-time, visually engaging summary of the child’s strengths and story as the parent progresses through the conversation wizard.
      </p>
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        {/* Profile preview UI will go here */}
        <div className="text-gray-400 text-center">[Profile Preview Placeholder]</div>
      </div>
    </main>
  );
} 