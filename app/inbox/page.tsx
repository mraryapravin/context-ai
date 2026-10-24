
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/prisma";

type TicketFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";

type InboxPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

const filters: { value: TicketFilter; label: string }[] = [
  { value: "ALL", label: "All Tickets" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const priorityStyles: Record<string, string> = {
  HIGH: "border-red-400 bg-red-400/20 hover:border-blue-500 hover:bg-blue-100",
  MEDIUM:
    "border-amber-500 bg-amber-500/20 hover:border-blue-500 hover:bg-blue-100",
  LOW: "border-green-400 bg-green-500/20 hover:border-blue-500 hover:bg-blue-100",
};

const priorityBadgeStyles: Record<string, string> = {
  HIGH: "bg-red-200 text-red-800",
  MEDIUM: "bg-orange-200 text-orange-800",
  LOW: "bg-green-200 text-green-800",
};

const statusBadgeStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSelectedFilter(
  status: string | string[] | undefined
): TicketFilter {
  if (typeof status !== "string") {
    return "ALL";
  }

  if (
    status === "OPEN" ||
    status === "IN_PROGRESS" ||
    status === "RESOLVED"
  ) {
    return status;
  }

  return "ALL";
}

async function TicketList({
  searchParams,
}: InboxPageProps) {
  const { status } = await searchParams;
  const selectedFilter = getSelectedFilter(status);

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });

  const counts: Record<TicketFilter, number> = {
    ALL: tickets.length,
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };

  for (const ticket of tickets) {
    if (
      ticket.status === "OPEN" ||
      ticket.status === "IN_PROGRESS" ||
      ticket.status === "RESOLVED"
    ) {
      counts[ticket.status] += 1;
    }
  }

  const filteredTickets =
    selectedFilter === "ALL"
      ? tickets
      : tickets.filter(
          (ticket) => ticket.status === selectedFilter
        );

  return (
    <div className="rounded-xl bg-white p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Ticket Inbox
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          View, filter and manage customer support tickets.
        </p>
      </div>

      {/* STATUS FILTERS */}
      <nav
        aria-label="Filter tickets by status"
        className="mt-6 flex flex-wrap gap-2 border-b border-gray-200 pb-5"
      >
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.value;

          const href =
            filter.value === "ALL"
              ? "/inbox"
              : `/inbox?status=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-[#4f6bff] bg-[#4f6bff] text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#4f6bff] hover:bg-blue-50"
              }`}
            >
              <span>{filter.label}</span>

              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {counts[filter.value]}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* RESULTS SUMMARY */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredTickets.length}
          </span>{" "}
          {filteredTickets.length === 1 ? "ticket" : "tickets"}
        </p>

        <p className="text-xs text-gray-400">
          Newest first
        </p>
      </div>

      {/* TICKET LIST */}
      {filteredTickets.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="font-medium text-gray-700">
            {selectedFilter === "ALL"
              ? "No tickets yet."
              : `No ${formatStatus(selectedFilter).toLowerCase()} tickets.`}
          </p>

          {selectedFilter !== "ALL" && (
            <Link
              href="/inbox"
              className="mt-3 inline-block text-sm font-semibold text-[#4f6bff] hover:underline"
            >
              View all tickets
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/inbox/${ticket.id}`}
              className={`block rounded-lg border p-4 transition hover:shadow-sm ${
                priorityStyles[ticket.priority] ??
                "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-gray-900">
                  {ticket.title}
                </h3>

                <span className="shrink-0 text-sm font-medium text-gray-600">
                  View ticket →
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-gray-600">
                {ticket.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span
                  className={`inline-block rounded-md px-3 py-1 font-semibold ${
                    statusBadgeStyles[ticket.status] ??
                    "bg-gray-200 text-gray-800"
                  }`}
                >
                  {formatStatus(ticket.status)}
                </span>

                <span
                  className={`inline-block rounded-md px-3 py-1 font-semibold ${
                    priorityBadgeStyles[ticket.priority] ??
                    "bg-gray-200 text-gray-800"
                  }`}
                >
                  Customer Priority: {ticket.priority}
                </span>

                <span className="text-gray-500">
                  {ticket.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

async function ProtectedInbox(props: InboxPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen gap-4 bg-[#4f6bff] p-4">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Topbar />

        <main className="flex-1">
          <Suspense
            fallback={
              <p className="mt-8 text-white">
                Loading tickets...
              </p>
            }
          >
            <TicketList {...props} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function InboxPage(props: InboxPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#4f6bff] text-white">
          Loading inbox...
        </div>
      }
    >
      <ProtectedInbox {...props} />
    </Suspense>
  );
}
