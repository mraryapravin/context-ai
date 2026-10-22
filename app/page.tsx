
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#4f6bff] p-4 gap-4">
      {/* Left navigation */}
      <aside className="w-64 shrink-0 rounded-xl bg-white p-6">
        <Image
          src="/context-logo.png"
          alt="Context AI"
          width={240}
          height={140}
          className="h-auto w-40"
        />

        <nav className="mt-10 flex flex-col gap-2">
          <div className="rounded-lg bg-[#eef1ff] p-3 text-[#4f6bff]">
            Overview
          </div>
          <div className="p-3 text-gray-600">Inbox</div>
          <div className="p-3 text-gray-600">Ticket Board</div>
          <div className="p-3 text-gray-600">Analytics</div>
          <div className="p-3 text-gray-600">Settings</div>
        </nav>
      </aside>

      {/* Main application area */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Top navigation */}
        <header className="flex items-center justify-between rounded-xl bg-white px-6 py-5">
          <h1 className="text-xl font-semibold text-gray-900">
            Overview
          </h1>
          <span className="text-sm text-gray-500">
            Context AI Dashboard
          </span>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 p-4">
          <h2 className="text-2xl font-semibold text-white">
            Your support dashboard
          </h2>

          <p className="mt-2 text-white/80">
            Manage and prioritise customer support tickets.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: "Total Tickets", value: 200 },
              { title: "Open Tickets", value: 50 },
              { title: "High Priority", value: 5 },
            ].map((stat) => (
              <div
                key={stat.title}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <h3 className="text-sm text-gray-500">
                  {stat.title}
                </h3>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
