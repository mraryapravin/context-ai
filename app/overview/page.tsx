
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import StatCard from "@/components/dashboard/StatCard";
import TicketStats from "@/components/dashboard/TicketStats";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

async function ProtectedOverview() {
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Suspense
              fallback={
                <>
                  <StatCard title="Total Tickets" value="-" />
                  <StatCard title="Open Tickets" value="-" />
                  <StatCard title="High Priority" value="-" />
                </>
              }
            >
              <TicketStats />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#4f6bff] text-white">
          Loading dashboard...
        </div>
      }
    >
      <ProtectedOverview />
    </Suspense>
  );
}
