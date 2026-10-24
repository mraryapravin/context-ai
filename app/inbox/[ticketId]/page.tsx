
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatusSelector from "@/components/tickets/StatusSelector";
import { prisma } from "@/lib/prisma";

type TicketPageProps = {
  params: Promise<{ ticketId: string }>;
};

const priorityStyles: Record<string, string> = {
  HIGH: "border-red-400 bg-red-50 text-red-800",
  MEDIUM: "border-amber-400 bg-amber-50 text-amber-800",
  LOW: "border-green-400 bg-green-50 text-green-800",
};

const analysisStyles: Record<string, string> = {
  HIGH: "border-red-200 bg-red-50 text-red-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  LOW: "border-green-200 bg-green-50 text-green-800",
  NEGATIVE: "border-red-200 bg-red-50 text-red-800",
  NEUTRAL: "border-gray-200 bg-gray-100 text-gray-700",
  POSITIVE: "border-green-200 bg-green-50 text-green-800",
};

function AnalysisField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">
        {label}
      </span>

      {value ? (
        <span
          className={`shrink-0 rounded-md border px-3 py-1 text-xs font-semibold ${
            analysisStyles[value] ??
            "border-gray-200 bg-gray-100 text-gray-700"
          }`}
        >
          {value}
        </span>
      ) : (
        <span className="text-xs text-gray-400">
          Unavailable
        </span>
      )}
    </div>
  );
}

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

  const hasAiAnalysis =
    ticket.aiUrgency !== null ||
    ticket.aiSentiment !== null ||
    ticket.aiEscalationRisk !== null ||
    ticket.aiReason !== null ||
    ticket.aiSummary !== null ||
    (ticket.aiRecommendedActions?.length ?? 0) > 0 ||
    ticket.aiCommunicationGuidance !== null;

  return (
    <div className="flex min-h-screen gap-4 bg-[#4f6bff] p-4">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Topbar />

        <main className="flex-1">
          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">

            {/* LEFT: CUSTOMER TICKET */}
            <section className="h-full min-w-0 rounded-xl bg-white p-6">
              <Link
                href="/inbox"
                className="text-sm font-medium text-[#4f6bff] hover:underline"
              >
                ← Back to Inbox
              </Link>

              <div className="mt-7">
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

                <span
                  className={`mt-5 inline-block rounded-lg border px-3 py-2 text-xs font-semibold ${
                    priorityStyles[ticket.priority] ??
                    "border-gray-300 bg-gray-100 text-gray-800"
                  }`}
                >
                  CUSTOMER PRIORITY: {ticket.priority}
                </span>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700">
                  Description
                </h3>

                <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-5 text-sm leading-7 text-gray-800">
                  {ticket.description}
                </p>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700">
                  Current Status
                </h3>

                <StatusSelector
                  ticketId={ticket.id}
                  currentStatus={ticket.status}
                />
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700">
                  Ticket ID
                </h3>

                <p className="mt-2 break-all font-mono text-xs text-gray-500">
                  {ticket.id}
                </p>
              </div>
            </section>

            {/* RIGHT: AI SUPPORT COPILOT */}
            <aside className="h-full min-w-0 rounded-xl bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    AI Analysis
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Powered by GroqCloud
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  AI
                </span>
              </div>

              {hasAiAnalysis ? (
                <div className="mt-6 space-y-5">

                  {/* ISSUE SUMMARY */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Issue Summary
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {ticket.aiSummary ??
                        "No AI summary available for this ticket."}
                    </p>
                  </div>

                  {/* CLASSIFICATION */}
                  <div>
                    <AnalysisField
                      label="Urgency"
                      value={ticket.aiUrgency}
                    />

                    <AnalysisField
                      label="Sentiment"
                      value={ticket.aiSentiment}
                    />

                    <AnalysisField
                      label="Escalation Risk"
                      value={ticket.aiEscalationRisk}
                    />
                  </div>

                  {/* ASSESSMENT RATIONALE */}
                  {ticket.aiReason && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Assessment Rationale
                      </h4>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                        {ticket.aiReason}
                      </p>
                    </div>
                  )}

                  {/* RECOMMENDED ACTIONS */}
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Recommended Actions
                    </h4>

                    {(ticket.aiRecommendedActions?.length ?? 0) > 0 ? (
                      <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-700 marker:font-semibold marker:text-indigo-600">
                        {(ticket.aiRecommendedActions ?? []).map(
                          (action, index) => (
                            <li key={index} className="pl-1">
                              {action}
                            </li>
                          )
                        )}
                      </ol>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        No recommended actions available.
                      </p>
                    )}
                  </div>

                  {/* COMMUNICATION GUIDANCE */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Customer Communication Guidance
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {ticket.aiCommunicationGuidance ??
                        "No communication guidance available."}
                    </p>
                  </div>

                  {/* DISCLAIMER */}
                  <p className="text-xs leading-5 text-gray-400">
                    AI-generated recommendations may be inaccurate.
                    Support agents should verify information and
                    review suggested actions before proceeding.
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    AI analysis unavailable
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    This ticket may predate AI classification,
                    or the classification service may have
                    been unavailable.
                  </p>
                </div>
              )}

              {/* Priority scoring will be added here later */}
            </aside>
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
