
"use client";

import { usePathname } from "next/navigation";

export default function Topbar() {
  const pathname = usePathname();

  const pageTitle =
    pathname === "/inbox" 
    ? "Inbox" 
    : "Overview";

  return (
    <header className="flex items-center justify-between rounded-xl bg-white px-6 py-5">
      <h1 className="text-xl font-semibold text-gray-900">
        {pageTitle}
      </h1>

      <span className="text-sm text-gray-500">
        ContextAI dashboard
      </span>
    </header>
  );
}
