"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
    <img
      src="/WrenchOps_Logo.png"
      alt="WrenchOps"
      className="mb-6 h-32 w-auto"
    />
    <form
      onSubmit={handleLogin}
      className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow"
    >
      <h1 className="text-2xl font-bold text-gray-800">Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border p-3"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border p-3"
        required
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-slate-800 px-4 py-3 text-white disabled:opacity-50 hover:bg-slate-700"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <p className="text-sm text-gray-600">
        Need an account?{" "}
        <Link href="/signup" className="underline">
          Create one
        </Link>
      </p>
    </form>
  </main>
);
}