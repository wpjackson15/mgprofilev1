"use client";
import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
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
        <span className="text-xs text-gray-600">Signed in as <span className="font-mono">{user.email || user.uid}</span></span>
        <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">Sign Out</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow w-72">
      <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2 text-gray-900"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2 text-gray-900"
          required
        />
        {error && <div className="text-red-500 text-xs">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          {mode === "login" ? "Sign In" : "Register"}
        </button>
      </form>
      <div className="text-xs text-gray-600 mt-2 text-center">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{' '}
            <button className="underline" onClick={() => setMode("register")}>Register</button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button className="underline" onClick={() => setMode("login")}>Sign In</button>
          </>
        )}
      </div>
    </div>
  );
} 