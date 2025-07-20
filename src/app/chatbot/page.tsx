import ChatbotWizard from "./ChatbotWizard";
import ProfilePreview from "../profile-preview/ProfilePreview";

export default function ChatbotPage() {
  // Placeholder: In the next step, wire up real answers from the chatbot
  const answers = {};

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-4">My Genius Profile</h1>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-5xl">
        <div className="flex-1">
          <ChatbotWizard />
        </div>
        <div className="flex-1">
          <ProfilePreview answers={answers} />
        </div>
      </div>
    </main>
  );
} 