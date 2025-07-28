import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 relative">
      {/* Top-right AuthButton and notice */}
      <div className="absolute top-4 right-6 flex flex-col items-end z-10">
        <AuthButton />
        {/* Optional: Notice line, e.g., Signed in as... */}
        {/* <span className="text-xs text-gray-500 mt-1">Signed in as user@email.com</span> */}
      </div>
      <h1 className="text-4xl font-bold mb-4">My Genius Profile</h1>
      <p className="mb-6 text-center max-w-xl">
        Welcome! My Genius Profile helps parents and children build a strength-based profile to share with teachers, aiming to inspire more personalized learning experiences.
      </p>
      <div className="flex gap-4">
        <Link href="/chatbot" className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">Start Profile Generation</Link>
        <Link href="/lesson-plans" className="px-6 py-3 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 transition">Make My Genius Lesson Plans</Link>
      </div>
    </main>
  );
}
