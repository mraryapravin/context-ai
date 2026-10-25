
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";
import Link from "next/link";

type TicketMessage = {
  id: string;
  authorType: string;
  authorName: string | null;
  body: string;
  createdAt: string;
};

type TicketInfo = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

type ConversationData = {
  ticket: TicketInfo;
  messages: TicketMessage[];
};

type TicketConversationProps = {
  ticketId: string;
  mode: "staff" | "customer";
  accessToken?: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default function TicketConversation({
  ticketId,
  mode,
  accessToken,
}: TicketConversationProps) {
  const [conversation, setConversation] =
    useState<ConversationData | null>(null);

  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const loadConversation = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const headers: Record<string, string> = {};

        if (mode === "customer") {
          if (!accessToken) {
            throw new Error("Missing access token.");
          }

          headers["x-ticket-access-token"] =
            accessToken;
        }

        const response = await fetch(
          `/api/tickets/${encodeURIComponent(
            ticketId
          )}/messages`,
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Could not load this conversation."
          );
        }

        const data: ConversationData =
          await response.json();

        setConversation(data);
        setError("");
      } catch {
        setError(
          "Unable to load this conversation. Check your access link or try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [ticketId, mode, accessToken]
  );

  useEffect(() => {
    void loadConversation(true);
  }, [loadConversation]);

  async function sendReply(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!reply.trim() || sending) {
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (mode === "customer") {
        if (!accessToken) {
          throw new Error("Missing access token.");
        }

        headers["x-ticket-access-token"] =
          accessToken;
      }

      const response = await fetch(
        `/api/tickets/${encodeURIComponent(
          ticketId
        )}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: reply,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send reply.");
      }

      setReply("");
      setMessage("Reply sent successfully.");

      await loadConversation();
    } catch {
      setError(
        "Your reply could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  async function copyAccessLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);
    } catch {
      setCopied(false);
      setError(
        "Could not copy the link automatically. Please copy it from your browser's address bar."
      );
    }
  }

  return (
    <section
      className={
        mode === "customer"
          ? "mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          : "mt-4 rounded-xl border border-gray-200 bg-white p-5"
      }
    >
      {mode === "customer" && (
        <div className="mb-7">
          <Link
            href="/"
            className="text-sm font-medium text-[#4f6bff] hover:underline"
          >
            ← Context AI
          </Link>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Your Support Ticket
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            View your conversation with our support
            team and send additional messages.
          </p>

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Save your private ticket link
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              This link allows access to your ticket
              and its messages without logging in.
              Keep it private and save it so you can
              return later.
            </p>

            <button
              type="button"
              onClick={copyAccessLink}
              className="mt-3 rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              {copied
                ? "Link Copied!"
                : "Copy Private Access Link"}
            </button>
          </div>
        </div>
      )}

      {loading && !conversation ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Loading conversation...
        </p>
      ) : !conversation ? (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error || "Conversation unavailable."}
          </p>
        </div>
      ) : (
        <>
          {mode === "customer" && (
            <div className="mb-7 rounded-lg bg-gray-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {conversation.ticket.title}
                </h2>

                <span
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    conversation.ticket.status ===
                    "RESOLVED"
                      ? "bg-green-100 text-green-800"
                      : conversation.ticket.status ===
                          "IN_PROGRESS"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {formatStatus(
                    conversation.ticket.status
                  )}
                </span>
              </div>

              <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-700">
                {conversation.ticket.description}
              </p>

              <p className="mt-4 text-xs text-gray-500">
                Submitted{" "}
                {formatDate(
                  conversation.ticket.createdAt
                )}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Conversation
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {conversation.messages.length}{" "}
                {conversation.messages.length === 1
                  ? "message"
                  : "messages"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessage("");
                void loadConversation(true);
              }}
              disabled={loading || sending}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Messages"}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {conversation.messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
                <p className="text-sm text-gray-500">
                  No replies yet. Messages from the
                  support team and customer will
                  appear here.
                </p>
              </div>
            ) : (
              conversation.messages.map((item) => {
                const isStaff =
                  item.authorType === "STAFF";

                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 ${
                      isStaff
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {isStaff
                          ? item.authorName ||
                            "Support Agent"
                          : "Customer"}
                      </span>

                      <span className="text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-800">
                      {item.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={sendReply}
            className="mt-6 border-t border-gray-200 pt-5"
          >
            <label
              htmlFor={`reply-${mode}`}
              className="block text-sm font-semibold text-gray-900"
            >
              Write a Reply
            </label>

            <textarea
              id={`reply-${mode}`}
              rows={4}
              required
              maxLength={5000}
              value={reply}
              onChange={(event) =>
                setReply(event.target.value)
              }
              disabled={sending}
              placeholder={
                mode === "staff"
                  ? "Write your response to the customer..."
                  : "Write a message to the support team..."
              }
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-[#4f6bff] focus:outline-none disabled:opacity-50"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={
                  sending || !reply.trim()
                }
                className="rounded-lg bg-[#4f6bff] px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending
                  ? "Sending..."
                  : "Send Reply"}
              </button>
            </div>
          </form>

          {message && (
            <p
              role="status"
              className="mt-3 text-sm text-green-700"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <p className="mt-4 text-xs leading-5 text-gray-400">
            Messages are saved to your support
            ticket. Select Refresh Messages to
            see replies sent from another window.
          </p>
        </>
      )}
    </section>
  );
}
