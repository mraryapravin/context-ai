
import { prisma } from "@/lib/prisma";
import StatCard from "./StatCard";

export default async function TicketStats() {
  const [totalTickets, openTickets, highPriorityTickets] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({
        where: { status: "OPEN" },
      }),
      prisma.ticket.count({
        where: { priority: "HIGH" },
      }),
    ]);

  return (
    <>
      <StatCard title="Total Tickets" value={totalTickets} />
      <StatCard title="Open Tickets" value={openTickets} />
      <StatCard title="High Priority" value={highPriorityTickets} />
    </>
  );
}
