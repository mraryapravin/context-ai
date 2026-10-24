"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SubmitTicketPage() {
  const [title, setTitle] = useState("");
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit ticket");
      }

      router.push("/submit/success");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#4f6bff] p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl">
        <Link href="/" className="text-sm text-[#4f6bff]">
          ← Back to home
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Submit a Support Ticket
        </h1>

        <p className="mt-2 text-gray-600">
          Tell us about your issue and our support team will review it.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              placeholder="Briefly describe your issue"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              required
              maxLength={5000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              placeholder="Provide more details about your request"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              How urgent is your issue?
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4f6bff] p-3 font-semibold text-white transition hover:bg-[#4058e8] disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>

        {message && (
          <p role="status" className="mt-5 text-center text-sm text-gray-700">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
