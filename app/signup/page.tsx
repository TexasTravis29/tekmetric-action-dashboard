"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [tekmetricShopId, setTekmetricShopId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("User was not created.");

      const parsedShopId = Number(tekmetricShopId);
      if (!parsedShopId || Number.isNaN(parsedShopId)) {
        throw new Error("Tekmetric Shop ID must be a valid number.");
      }

      const { error: shopUpsertError } = await supabase
        .from("shops")
        .upsert(
          {
            tekmetric_shop_id: parsedShopId,
            shop_name: shopName,
          },
          { onConflict: "tekmetric_shop_id" }
        );

      if (shopUpsertError) throw shopUpsertError;

      const { data: shopRow, error: shopFetchError } = await supabase
        .from("shops")
        .select("id")
        .eq("tekmetric_shop_id", parsedShopId)
        .single();

      if (shopFetchError) throw shopFetchError;

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: user.id,
        shop_id: shopRow.id,
        email,
      });

      if (profileError) throw profileError;

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-4 rounded-2xl border p-6 shadow"
      >
        <h1 className="text-2xl font-bold">Create Account</h1>

        <input
          type="text"
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          className="w-full rounded border p-3"
          required
        />

        <input
          type="number"
          placeholder="Tekmetric Shop ID"
          value={tekmetricShopId}
          onChange={(e) => setTekmetricShopId(e.target.value)}
          className="w-full rounded border p-3"
          required
        />

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
          className="w-full rounded bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </main>
  );
}