import React from "react";

interface ProfilePreviewProps {
  answers: Record<string, string[]>;
}

export default function ProfilePreview({ answers }: ProfilePreviewProps) {
  // Group answers by module
  const grouped: Record<string, string[]> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(...value);
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-2xl font-bold mb-4">Profile Preview</h2>
      <p className="mb-4 text-gray-600">
        This panel shows a real-time summary of your child’s strengths and story as you answer questions.
      </p>
      {Object.keys(grouped).length === 0 ? (
        <div className="text-gray-400 text-center mb-2">[Profile Preview Placeholder]</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([module, responses]) => (
            <div key={module}>
              <h3 className="font-semibold capitalize mb-1">{module.replace(/-/g, " ")}</h3>
              <ul className="list-disc list-inside text-sm text-gray-800">
                {responses.map((resp, i) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 