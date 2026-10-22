import StatCard from "@/components/dashboard/StatCard";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#4f6bff] p-4 gap-4">
      {/* Left navigation */}
      <Sidebar />

      {/* Main application area */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Top navigation */}
        <Topbar />

        {/* Dashboard content */}
        <main className="flex-1 p-4">
          <h2 className="text-2xl font-semibold text-white">
            Your support dashboard
          </h2>

          <p className="mt-2 text-white/80">
            Manage and prioritise customer support tickets.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard title="Total Tickets" value={200} />
            <StatCard title="Open Tickets" value={50} />
            <StatCard title="High Priority" value={5} />
          </div>


        </main>
      </div>
    </div>
  );
}
