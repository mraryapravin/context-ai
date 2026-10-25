
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import InboxFilters from "@/components/tickets/InboxFilters";
import { prisma } from "@/lib/prisma";

type TicketFilter =
  | "ALL"
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED";

type PriorityFilter =
  | "ALL"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

type ReplyFilter =
  | "ALL"
  | "NEEDS_STAFF"
  | "WAITING_CUSTOMER";

type ReplyState =
  | "NEEDS_STAFF"
  | "WAITING_CUSTOMER"
  | "RESOLVED";

type InboxPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    priority?: string | string[];
    reply?: string | string[];
  }>;
};

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
    cardStyle:
      "border-green-200 bg-white hover:border-green-400",
  },
  {
    value: "MEDIUM",
    label: "Medium Priority",
    description: "Needs attention",
    containerStyle: "border-amber-200 bg-amber-50/70",
    headingStyle: "text-amber-900",
    countStyle: "bg-amber-200 text-amber-900",
    cardStyle:
      "border-amber-200 bg-white hover:border-amber-400",
  },
  {
    value: "HIGH",
    label: "High Priority",
    description: "Requires prompt attention",
    containerStyle: "border-red-200 bg-red-50/70",
    headingStyle: "text-red-900",
    countStyle: "bg-red-200 text-red-900",
    cardStyle:
      "border-red-200 bg-white hover:border-red-400",
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
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getStatusFilter(
  value: string | string[] | undefined
): TicketFilter {
  if (
    value === "OPEN" ||
    value === "IN_PROGRESS" ||
    value === "RESOLVED"
  ) {
    return value;
  }

  return "ALL";
}

function getPriorityFilter(
  value: string | string[] | undefined
): PriorityFilter {
  if (
    value === "LOW" ||
    value === "MEDIUM" ||
    value === "HIGH"
  ) {
    return value;
  }

  return "ALL";
}

function getReplyFilter(
  value: string | string[] | undefined
): ReplyFilter {
  if (
    value === "NEEDS_STAFF" ||
    value === "WAITING_CUSTOMER"
  ) {
    return value;
  }

  return "ALL";
}

function getReplyState(
  ticketStatus: string,
  latestAuthorType: string | null
): ReplyState {
  if (ticketStatus === "RESOLVED") {
    return "RESOLVED";
  }

  if (
    latestAuthorType === null ||
    latestAuthorType === "CUSTOMER"
  ) {
    return "NEEDS_STAFF";
  }

  return "WAITING_CUSTOMER";
}

async function TicketList({
  searchParams,
}: InboxPageProps) {
  const params = await searchParams;

  const selectedStatus = getStatusFilter(params.status);
  const selectedPriority = getPriorityFilter(
    params.priority
  );
  const selectedReply = getReplyFilter(params.reply);

  const tickets = await prisma.ticket.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      messages: {
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        take: 1,
        select: {
          authorType: true,
          createdAt: true,
        },
      },
    },
  });

  const ticketsWithReplyState = tickets.map((ticket) => {
    const latestMessage = ticket.messages[0] ?? null;

    return {
      ...ticket,
      latestMessage,
      replyState: getReplyState(
        ticket.status,
        latestMessage?.authorType ?? null
      ),
    };
  });

  // Each count respects the other two filters.
  const statusCounts: Record<TicketFilter, number> = {
    ALL: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };

  const priorityCounts: Record<PriorityFilter, number> = {
    ALL: 0,
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  const replyCounts: Record<ReplyFilter, number> = {
    ALL: 0,
    NEEDS_STAFF: 0,
    WAITING_CUSTOMER: 0,
  };

  for (const ticket of ticketsWithReplyState) {
    const matchesStatus =
      selectedStatus === "ALL" ||
      ticket.status === selectedStatus;

    const matchesPriority =
      selectedPriority === "ALL" ||
      ticket.priority === selectedPriority;

    const matchesReply =
      selectedReply === "ALL" ||
      ticket.replyState === selectedReply;

    if (matchesPriority && matchesReply) {
      statusCounts.ALL += 1;

      if (
        ticket.status === "OPEN" ||
        ticket.status === "IN_PROGRESS" ||
        ticket.status === "RESOLVED"
      ) {
        statusCounts[ticket.status] += 1;
      }
    }

    if (matchesStatus && matchesReply) {
      priorityCounts.ALL += 1;

      if (
        ticket.priority === "LOW" ||
        ticket.priority === "MEDIUM" ||
        ticket.priority === "HIGH"
      ) {
        priorityCounts[ticket.priority] += 1;
      }
    }

    if (matchesStatus && matchesPriority) {
      replyCounts.ALL += 1;

      if (
        ticket.replyState === "NEEDS_STAFF" ||
        ticket.replyState === "WAITING_CUSTOMER"
      ) {
        replyCounts[ticket.replyState] += 1;
      }
    }
  }

  const filteredTickets = ticketsWithReplyState.filter(
    (ticket) => {
      const matchesStatus =
        selectedStatus === "ALL" ||
        ticket.status === selectedStatus;

      const matchesPriority =
        selectedPriority === "ALL" ||
        ticket.priority === selectedPriority;

      const matchesReply =
        selectedReply === "ALL" ||
        ticket.replyState === selectedReply;

      return (
        matchesStatus &&
        matchesPriority &&
        matchesReply
      );
    }
  );

  const visibleColumns = priorityColumns.filter(
    (column) =>
      selectedPriority === "ALL" ||
      column.value === selectedPriority
  );

  return (
    <div className="min-w-0 rounded-xl bg-white p-5 sm:p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Ticket Inbox
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          View, filter and manage customer support tickets.
        </p>
      </div>

      {/* COMPACT DROPDOWN FILTERS */}
      <InboxFilters
        status={selectedStatus}
        priority={selectedPriority}
        reply={selectedReply}
        statusCounts={statusCounts}
        priorityCounts={priorityCounts}
        replyCounts={replyCounts}
      />

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
              {/* COLUMN HEADER */}
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

              {/* TICKET CARDS */}
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
                        {/* TICKET STATUS */}
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            statusBadgeStyles[ticket.status] ??
                            "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {formatStatus(ticket.status)}
                        </span>

                        {/* REPLY STATUS */}
                        {ticket.replyState ===
                          "NEEDS_STAFF" && (
                          <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                            {ticket.latestMessage
                              ? "Needs Staff Reply"
                              : "Awaiting First Reply"}
                          </span>
                        )}

                        {ticket.replyState ===
                          "WAITING_CUSTOMER" && (
                          <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                            Awaiting Customer
                          </span>
                        )}
                      </div>

                      {/* LATEST ACTIVITY */}
                      {ticket.latestMessage && (
                        <p className="mt-3 text-xs text-gray-500">
                          Last reply:{" "}
                          {ticket.latestMessage.authorType ===
                          "CUSTOMER"
                            ? "Customer"
                            : "Staff"}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-gray-400">
                        Submitted{" "}
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
