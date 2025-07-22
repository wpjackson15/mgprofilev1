import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="w-full flex justify-end mb-4">
        <AuthButton />
      </div>
      <h1 className="text-4xl font-bold mb-4">My Genius Profile</h1>
      <p className="mb-6 text-center max-w-xl">
        Welcome! My Genius Profile helps parents and children build a strength-based profile to share with teachers, aiming to inspire more personalized learning experiences.
      </p>
      <div className="flex gap-4">
        <Link href="/chatbot" className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">Start Profile Generation</Link>
        <Link href="/profile-preview" className="px-6 py-3 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 transition">View Profile Preview</Link>
        <Link href="/gemini-test" className="px-6 py-3 bg-yellow-200 text-gray-800 rounded shadow hover:bg-yellow-300 transition">Test Gemini Summary (dev)</Link>
        </div>
      </main>
  );
}
