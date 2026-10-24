
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error || !result?.url) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/overview");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#4f6bff] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Link href="/" className="text-sm text-[#4f6bff]">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-gray-900">
          Staff Login
        </h1>

        <p className="mt-2 text-gray-600">
          Sign in to manage customer support tickets.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Work Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4f6bff] p-3 font-semibold text-white transition hover:bg-[#4058e8] disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {error && (
            <p className="text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Authorised business staff only
        </p>
      </div>
    </main>
  );
}
