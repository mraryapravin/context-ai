
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";

type TicketFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";
type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

type InboxPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    priority?: string | string[];
  }>;
};

const statusFilters: {
  value: TicketFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All Tickets" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const priorityFilters: {
  value: PriorityFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const priorityColumns: {
  value: TicketPriority;
  label: string;
  description: string;
  containerStyle: string;
  headingStyle: string;
  countStyle: string;
  cardStyle: string;
}[] = [
  {
    value: "LOW",
    label: "Low Priority",
    description: "Routine enquiries",
    containerStyle: "border-green-200 bg-green-50/70",
    headingStyle: "text-green-900",
    countStyle: "bg-green-200 text-green-900",
    cardStyle: "border-green-200 bg-white hover:border-green-400",
  },
  {
    value: "MEDIUM",
    label: "Medium Priority",
    description: "Needs attention",
    containerStyle: "border-amber-200 bg-amber-50/70",
    headingStyle: "text-amber-900",
    countStyle: "bg-amber-200 text-amber-900",
    cardStyle: "border-amber-200 bg-white hover:border-amber-400",
  },
  {
    value: "HIGH",
    label: "High Priority",
    description: "Requires prompt attention",
    containerStyle: "border-red-200 bg-red-50/70",
    headingStyle: "text-red-900",
    countStyle: "bg-red-200 text-red-900",
    cardStyle: "border-red-200 bg-white hover:border-red-400",
  },
];

const statusBadgeStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getStatusFilter(
  status: string | string[] | undefined
): TicketFilter {
  if (
    status === "OPEN" ||
    status === "IN_PROGRESS" ||
    status === "RESOLVED"
  ) {
    return status;
  }

  return "ALL";
}

function getPriorityFilter(
  priority: string | string[] | undefined
): PriorityFilter {
  if (
    priority === "LOW" ||
    priority === "MEDIUM" ||
    priority === "HIGH"
  ) {
    return priority;
  }

  return "ALL";
}

function filterHref(
  status: TicketFilter,
  priority: PriorityFilter
) {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (priority !== "ALL") {
    params.set("priority", priority);
  }

  const query = params.toString();

  return query ? `/inbox?${query}` : "/inbox";
}

async function TicketList({
  searchParams,
}: InboxPageProps) {
  const params = await searchParams;

  const selectedStatus = getStatusFilter(params.status);
  const selectedPriority = getPriorityFilter(params.priority);

  const tickets = await prisma.ticket.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Status counts respect the selected priority.
  const statusCounts: Record<TicketFilter, number> = {
    ALL: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };

  // Priority counts respect the selected status.
  const priorityCounts: Record<PriorityFilter, number> = {
    ALL: 0,
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  for (const ticket of tickets) {
    if (
      selectedPriority === "ALL" ||
      ticket.priority === selectedPriority
    ) {
      statusCounts.ALL += 1;

      if (
        ticket.status === "OPEN" ||
        ticket.status === "IN_PROGRESS" ||
        ticket.status === "RESOLVED"
      ) {
        statusCounts[ticket.status] += 1;
      }
    }

    if (
      selectedStatus === "ALL" ||
      ticket.status === selectedStatus
    ) {
      priorityCounts.ALL += 1;

      if (
        ticket.priority === "LOW" ||
        ticket.priority === "MEDIUM" ||
        ticket.priority === "HIGH"
      ) {
        priorityCounts[ticket.priority] += 1;
      }
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      selectedStatus === "ALL" ||
      ticket.status === selectedStatus;

    const matchesPriority =
      selectedPriority === "ALL" ||
      ticket.priority === selectedPriority;

    return matchesStatus && matchesPriority;
  });

  const visibleColumns = priorityColumns.filter(
    (column) =>
      selectedPriority === "ALL" ||
      column.value === selectedPriority
  );

  return (
    <div className="min-w-0 rounded-xl bg-white p-5 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Ticket Inbox
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          View, filter and manage customer support tickets.
        </p>
      </div>

      {/* STATUS FILTERS */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Ticket Status
        </h2>

        <nav
          aria-label="Filter tickets by status"
          className="flex flex-wrap gap-2"
        >
          {statusFilters.map((filter) => {
            const isActive =
              selectedStatus === filter.value;

            return (
              <Link
                key={filter.value}
                href={filterHref(
                  filter.value,
                  selectedPriority
                )}
                aria-current={
                  isActive ? "page" : undefined
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#4f6bff] bg-[#4f6bff] text-white"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#4f6bff] hover:bg-blue-50"
                }`}
              >
                {filter.label}

                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {statusCounts[filter.value]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* PRIORITY FILTERS */}
      <div className="mt-5 border-b border-gray-200 pb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Customer Priority
        </h2>

        <nav
          aria-label="Filter tickets by priority"
          className="flex flex-wrap gap-2"
        >
          {priorityFilters.map((filter) => {
            const isActive =
              selectedPriority === filter.value;

            return (
              <Link
                key={filter.value}
                href={filterHref(
                  selectedStatus,
                  filter.value
                )}
                aria-current={
                  isActive ? "page" : undefined
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#4f6bff] bg-[#4f6bff] text-white"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#4f6bff] hover:bg-blue-50"
                }`}
              >
                {filter.label}

                {filter.value !== "ALL" && (
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {priorityCounts[filter.value]}
                </span>
              )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* RESULTS SUMMARY */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredTickets.length}
          </span>{" "}
          {filteredTickets.length === 1
            ? "ticket"
            : "tickets"}
        </p>

        <span className="text-xs text-gray-400">
          Customer priority · Newest first
        </span>
      </div>

      {/* PRIORITY COLUMNS */}
      <div
        className={`mt-5 grid grid-cols-1 items-start gap-4 ${
          visibleColumns.length === 3
            ? "lg:grid-cols-3"
            : "lg:grid-cols-1"
        }`}
      >
        {visibleColumns.map((column) => {
          const columnTickets = filteredTickets.filter(
            (ticket) =>
              ticket.priority === column.value
          );

          return (
            <section
              key={column.value}
              aria-label={`${column.label} tickets`}
              className={`min-w-0 rounded-xl border p-4 ${column.containerStyle}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    className={`text-base font-semibold ${column.headingStyle}`}
                  >
                    {column.label}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {column.description}
                  </p>
                </div>

                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${column.countStyle}`}
                >
                  {columnTickets.length}
                </span>
              </div>

              <div
                className={`mt-5 ${
                  visibleColumns.length === 1
                    ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                    : "space-y-3"
                }`}
              >
                {columnTickets.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 px-3 py-8 text-center">
                    <p className="text-xs text-gray-500">
                      No tickets in this column.
                    </p>
                  </div>
                ) : (
                  columnTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/inbox/${ticket.id}`}
                      className={`block min-w-0 rounded-lg border p-4 shadow-sm transition hover:shadow-md ${column.cardStyle}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 wrap-break-word text-sm font-semibold text-gray-900">
                          {ticket.title}
                        </h3>

                        <span className="shrink-0 text-gray-400">
                          →
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-600">
                        {ticket.description}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            statusBadgeStyles[ticket.status] ??
                            "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {formatStatus(ticket.status)}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-gray-400">
                        {ticket.createdAt.toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {filteredTickets.length === 0 && (
        <p className="mt-5 text-center text-sm text-gray-500">
          No tickets match these filters.
        </p>
      )}
    </div>
  );
}

async function ProtectedInbox(
  props: InboxPageProps
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen gap-4 bg-[#4f6bff] p-4">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Suspense
          fallback={
            <div className="rounded-xl bg-white p-6 text-sm text-gray-500">
              Loading tickets...
            </div>
          }
        >
          <TicketList {...props} />
        </Suspense>
      </main>
    </div>
  );
}

export default function InboxPage(
  props: InboxPageProps
) {
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
