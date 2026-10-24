
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

  async function handleSave() {
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
          body: JSON.stringify({ status: selectedStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update ticket status.");
      }

      setSavedStatus(selectedStatus);
      setMessage("Status updated successfully.");
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
            setSelectedStatus(event.target.value as TicketStatus);
            setMessage("");
          }}
          disabled={isSaving}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 focus:border-[#4f6bff] focus:outline-none"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || selectedStatus === savedStatus}
          className="rounded-lg bg-[#4f6bff] px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Status"}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-green-700">{message}</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
