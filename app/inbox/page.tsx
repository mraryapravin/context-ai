
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/prisma";

async function TicketList() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mt-8 rounded-xl bg-white p-6">
      {tickets.length === 0 ? (
        <p className="text-gray-500">No tickets yet.</p>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <h3 className="font-semibold text-gray-900">
                {ticket.title}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {ticket.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-block rounded-md bg-blue-100 px-3 py-1 font-medium text-blue-700">
                  {ticket.status}
                </span>

                <span className="inline-block rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-700">
                  {ticket.priority}
                </span>
              </div>
            </div>
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

        <main className="flex-1 p-4">
          <h2 className="text-2xl font-semibold text-white">
            Ticket Inbox
          </h2>

          <p className="mt-2 text-white/80">
            View and manage customer support tickets.
          </p>

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
