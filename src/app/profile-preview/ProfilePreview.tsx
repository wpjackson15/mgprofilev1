import React, { useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEmailSender } from "@/hooks/useEmailSender";

interface ProfilePreviewProps {
  answers: Record<string, string[]>;
}

function generateSummaryText(answers: Record<string, string[]>): string {
  let summary = "My Genius Profile Summary\n\n";
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    summary += `--- ${module.replace(/-/g, " ")} ---\n`;
    value.forEach((resp, i) => {
      summary += `• ${resp}\n`;
    });
    summary += "\n";
  });
  return summary;
}

export default function ProfilePreview({ answers }: ProfilePreviewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const { send, isSending, error, success, reset } = useEmailSender();

  // Group answers by module for display
  const grouped: Record<string, string[]> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const [module] = key.split("-");
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(...value);
  });

  const handleEmailSummary = async () => {
    if (!user?.email) return;
    reset();
    const summaryText = generateSummaryText(answers);
    await send({
      to: user.email,
      subject: "Your Genius Profile Summary",
      text: summaryText,
    });
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleEmailSummary}
            disabled={isSending || success}
          >
            {isSending ? "Sending..." : success ? "Email Sent!" : "Email Summary"}
          </button>
        ) : (
          <div className="text-sm text-gray-600">Please log in to email your summary.</div>
        )}
        {error && (
          <div className="text-xs text-red-600">
            {error} <button className="underline ml-2" onClick={reset}>Retry</button>
          </div>
        )}
        {success && (
          <div className="text-xs text-green-600">Email sent! Check your inbox.</div>
        )}
      </div>
    </div>
  );
} 