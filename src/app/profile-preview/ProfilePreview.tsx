import React from "react";

interface ProfilePreviewProps {
  answers: Record<string, string[]>;
}

export default function ProfilePreview({ answers }: ProfilePreviewProps) {
  // For now, just show a placeholder and the raw answers (if any)
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-2xl font-bold mb-4">Profile Preview</h2>
      <p className="mb-4 text-gray-600">
        This panel will show a real-time, visually engaging summary of the child’s strengths and story as the parent progresses through the conversation wizard.
      </p>
      <div className="text-gray-400 text-center mb-2">[Profile Preview Placeholder]</div>
      {Object.keys(answers).length > 0 && (
        <pre className="bg-gray-100 rounded p-2 text-xs text-left overflow-x-auto">{JSON.stringify(answers, null, 2)}</pre>
      )}
    </div>
  );
} 