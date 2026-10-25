
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type TicketStatus = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";
type TicketPriority = "ALL" | "LOW" | "MEDIUM" | "HIGH";
type ReplyStatus = "ALL" | "NEEDS_STAFF" | "WAITING_CUSTOMER";

type InboxFiltersProps = {
  status: TicketStatus;
  priority: TicketPriority;
  reply: ReplyStatus;
  statusCounts: Record<TicketStatus, number>;
  priorityCounts: Record<TicketPriority, number>;
  replyCounts: Record<ReplyStatus, number>;
};

export default function InboxFilters({
  status,
  priority,
  reply,
  statusCounts,
  priorityCounts,
  replyCounts,
}: InboxFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateFilter(
    field: "status" | "priority" | "reply",
    value: string
  ) {
    const params = new URLSearchParams();

    const nextFilters = {
      status,
      priority,
      reply,
      [field]: value,
    };

    if (nextFilters.status !== "ALL") {
      params.set("status", nextFilters.status);
    }

    if (nextFilters.priority !== "ALL") {
      params.set("priority", nextFilters.priority);
    }

    if (nextFilters.reply !== "ALL") {
      params.set("reply", nextFilters.reply);
    }

    const query = params.toString();

    startTransition(() => {
      router.push(query ? `/inbox?${query}` : "/inbox");
    });
  }

  const selectStyles =
    "mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 transition focus:border-[#4f6bff] focus:outline-none focus:ring-2 focus:ring-[#4f6bff]/20 disabled:opacity-60";

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* TICKET STATUS */}
        <div>
          <label
            htmlFor="ticket-status-filter"
            className="block text-sm font-semibold text-gray-700"
          >
            Ticket Status
          </label>

          <select
            id="ticket-status-filter"
            value={status}
            disabled={isPending}
            onChange={(event) =>
              updateFilter("status", event.target.value)
            }
            className={selectStyles}
          >
            <option value="ALL">
              All Tickets ({statusCounts.ALL})
            </option>
            <option value="OPEN">
              Open ({statusCounts.OPEN})
            </option>
            <option value="IN_PROGRESS">
              In Progress ({statusCounts.IN_PROGRESS})
            </option>
            <option value="RESOLVED">
              Resolved ({statusCounts.RESOLVED})
            </option>
          </select>
        </div>

        {/* CUSTOMER PRIORITY */}
        <div>
          <label
            htmlFor="customer-priority-filter"
            className="block text-sm font-semibold text-gray-700"
          >
            Customer Priority
          </label>

          <select
            id="customer-priority-filter"
            value={priority}
            disabled={isPending}
            onChange={(event) =>
              updateFilter("priority", event.target.value)
            }
            className={selectStyles}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">
              Low ({priorityCounts.LOW})
            </option>
            <option value="MEDIUM">
              Medium ({priorityCounts.MEDIUM})
            </option>
            <option value="HIGH">
              High ({priorityCounts.HIGH})
            </option>
          </select>
        </div>

        {/* REPLY STATUS */}
        <div>
          <label
            htmlFor="reply-status-filter"
            className="block text-sm font-semibold text-gray-700"
          >
            Reply Status
          </label>

          <select
            id="reply-status-filter"
            value={reply}
            disabled={isPending}
            onChange={(event) =>
              updateFilter("reply", event.target.value)
            }
            className={selectStyles}
          >
            <option value="ALL">All Conversations</option>
            <option value="NEEDS_STAFF">
              Needs Staff Reply ({replyCounts.NEEDS_STAFF})
            </option>
            <option value="WAITING_CUSTOMER">
              Awaiting Customer ({replyCounts.WAITING_CUSTOMER})
            </option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        

        {isPending && (
          <p className="text-xs font-medium text-[#4f6bff]">
            Updating tickets...
          </p>
        )}
      </div>
    </div>
  );
}
