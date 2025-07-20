"use client";
import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signInAnonymously, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    await signInAnonymously(auth);
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut(auth);
    setLoading(false);
  };

  if (loading) return <button className="px-4 py-2 bg-gray-300 rounded" disabled>Loading...</button>;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Signed in as <span className="font-mono">{user.isAnonymous ? "Anonymous" : user.email || user.uid}</span></span>
        <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">Sign Out</button>
      </div>
    );
  }

  return (
    <button onClick={handleSignIn} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
      Sign In Anonymously
    </button>
  );
} 