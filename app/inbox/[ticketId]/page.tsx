
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/prisma";

type TicketPageProps = {
  params: Promise<{ ticketId: string }>;
};

const priorityStyles: Record<string, string> = {
  HIGH: "border-red-400 bg-red-400/20 text-red-800",
  MEDIUM: "border-amber-500 bg-amber-500/20 text-amber-800",
  LOW: "border-green-400 bg-green-500/20 text-green-800",
};

async function ProtectedTicketDetails({
  params,
}: TicketPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <div className="flex min-h-screen gap-4 bg-[#4f6bff] p-4">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Topbar />

        <main className="flex-1">
          <div className="rounded-xl bg-white p-6">
            <Link
              href="/inbox"
              className="text-sm font-medium text-[#4f6bff] hover:underline"
            >
              ← Back to Inbox
            </Link>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {ticket.title}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Submitted{" "}
                  {ticket.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <span
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                  priorityStyles[ticket.priority] ??
                  "border-gray-300 bg-gray-100 text-gray-800"
                }`}
              >
                {ticket.priority} PRIORITY
              </span>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-700">
                Description
              </h3>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-5 text-gray-800">
                {ticket.description}
              </p>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700">
                Current Status
              </h3>

              <span className="mt-3 inline-block rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                {ticket.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700">
                Ticket ID
              </h3>

              <p className="mt-2 break-all font-mono text-sm text-gray-500">
                {ticket.id}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function TicketDetailsPage(
  props: TicketPageProps
) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#4f6bff] text-white">
          Loading ticket...
        </div>
      }
    >
      <ProtectedTicketDetails {...props} />
    </Suspense>
  );
}
