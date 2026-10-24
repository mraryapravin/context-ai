
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/prisma";

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

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function TicketList() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="rounded-xl bg-white p-6">
      {tickets.length === 0 ? (
        <p className="text-gray-500">No tickets yet.</p>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
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

              <p className="mt-1 text-sm text-gray-600">
                {ticket.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-block rounded-md bg-white/70 px-3 py-1 font-medium text-gray-700">
                  {formatStatus(ticket.status)}
                </span>

                <span
                  className={`inline-block rounded-md px-3 py-1 font-semibold ${
                    priorityBadgeStyles[ticket.priority] ??
                    "bg-gray-200 text-gray-800"
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

async function ProtectedInbox() {
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
              <p className="mt-8 text-white">Loading tickets...</p>
            }
          >
            <TicketList />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#4f6bff] text-white">
          Loading inbox...
        </div>
      }
    >
      <ProtectedInbox />
    </Suspense>
  );
}
