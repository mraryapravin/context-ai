
import { Suspense } from "react";
import type { Metadata } from "next";

import TicketConversation from "@/components/tickets/TicketConversation";

type CustomerTicketPageProps = {
  params: Promise<{
    ticketID: string;
    accessToken: string;
  }>;
};

export const metadata: Metadata = {
  title: "Your Support Ticket | Context AI",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

async function CustomerTicketContent({
  params,
}: CustomerTicketPageProps) {
  const { ticketID, accessToken } = await params;

  return (
    <main className="min-h-screen bg-[#4f6bff] p-4 py-10 sm:p-8">
      <TicketConversation
        ticketId={ticketID}
        accessToken={accessToken}
        mode="customer"
      />
    </main>
  );
}

export default function CustomerTicketPage(
  props: CustomerTicketPageProps
) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#4f6bff] text-white">
          Loading your ticket...
        </div>
      }
    >
      <CustomerTicketContent {...props} />
    </Suspense>
  );
}
