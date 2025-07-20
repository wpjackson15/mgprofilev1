import ChatbotWizard from "./ChatbotWizard";

export default function ChatbotPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Conversation Wizard</h1>
      <ChatbotWizard />
    </main>
  );
} 