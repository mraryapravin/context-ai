
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

type StatusSelectorProps = {
  ticketId: string;
  currentStatus: string;
};

export default function StatusSelector({
  ticketId,
  currentStatus,
}: StatusSelectorProps) {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] =
    useState<TicketStatus>(currentStatus as TicketStatus);

  const [savedStatus, setSavedStatus] =
    useState(currentStatus);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isResolved = savedStatus === "RESOLVED";

  async function saveStatus(status: TicketStatus) {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/tickets/${encodeURIComponent(ticketId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update ticket status.");
      }

      setSavedStatus(status);
      setSelectedStatus(status);

      if (status === "RESOLVED") {
        setMessage("Ticket marked as resolved.");
      } else if (
        status === "OPEN" &&
        savedStatus === "RESOLVED"
      ) {
        setMessage("Ticket reopened successfully.");
      } else {
        setMessage("Status updated successfully.");
      }

      router.refresh();
    } catch {
      setError("Could not save the status. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(
              event.target.value as TicketStatus
            );
            setMessage("");
            setError("");
          }}
          disabled={isSaving}
          aria-label="Ticket status"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 focus:border-[#4f6bff] focus:outline-none"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <button
          type="button"
          onClick={() => saveStatus(selectedStatus)}
          disabled={
            isSaving || selectedStatus === savedStatus
          }
          className="rounded-lg bg-[#4f6bff] px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Status"}
        </button>
      </div>

      {/* QUICK RESOLVE / REOPEN ACTION */}
      <div className="mt-5 border-t border-gray-100 pt-5">
        <p className="mb-3 text-xs text-gray-500">
          {isResolved
            ? "This ticket has been resolved. You can reopen it if further support is needed."
            : "Finished handling this ticket? Mark it as resolved to close it."}
        </p>

        <button
          type="button"
          onClick={() =>
            saveStatus(isResolved ? "OPEN" : "RESOLVED")
          }
          disabled={isSaving}
          className={`rounded-lg border px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isResolved
              ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
              : "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
          }`}
        >
          {isSaving
            ? "Updating..."
            : isResolved
              ? "Reopen Ticket"
              : "✓ Mark as Resolved"}
        </button>
      </div>

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
    </div>
  );
}
