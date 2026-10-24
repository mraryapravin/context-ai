
"use client";

import { usePathname } from "next/navigation";

export default function Topbar() {
  const pathname = usePathname();

  const pageInfo =
    pathname === "/inbox" || pathname.startsWith("/inbox/")
      ? {
          title: "Ticket Inbox",
          subtitle: "View and manage customer support tickets.",
        }
      : pathname === "/overview"
        ? {
            title: "Your Support Dashboard",
            subtitle: "Manage and prioritise customer support tickets.",
          }
        : {
            title: "Context AI",
            subtitle: "Your customer support workspace.",
          };

  return (
    <header className="flex min-h-32 items-center rounded-xl bg-white px-7 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {pageInfo.title}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {pageInfo.subtitle}
        </p>
      </div>
    </header>
  );
}
