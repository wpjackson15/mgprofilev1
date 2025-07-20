import React, { useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface ProfilePreviewProps {
  answers: Record<string, string[]>;
}

export default function ProfilePreview({ answers }: ProfilePreviewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Group answers by module
  const grouped: Record<string, string[]> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(...value);
  });

  const handleEmailSummary = async () => {
    setEmailStatus("Sending...");
    // TODO: Implement email sending logic
    setTimeout(() => setEmailStatus("Summary sent! (MVP placeholder)"), 1000);
  };

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
      <div className="mt-6 flex flex-col items-center gap-2">
        {checkingAuth ? (
          <button className="px-4 py-2 bg-gray-300 rounded" disabled>Checking login...</button>
        ) : user ? (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleEmailSummary}
          >
            Email Summary
          </button>
        ) : (
          <div className="text-sm text-gray-600">Please log in to email your summary.</div>
        )}
        {emailStatus && <div className="text-xs text-green-600">{emailStatus}</div>}
      </div>
    </div>
  );
} 