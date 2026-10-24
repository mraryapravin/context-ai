
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/overview" },
    { name: "Inbox", href: "/inbox" },
  ];

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col rounded-xl bg-white p-6">
      <Image
        src="/context-logo.png"
        alt="Context AI"
        width={240}
        height={140}
        className="h-auto w-40"
      />

      <nav className="mt-10 flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg p-3 ${
              pathname === link.href
                ? "bg-[#eef1ff] font-medium text-[#4f6bff]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {link.name}
          </Link>
        ))}

        <div className="p-3 text-gray-600">Ticket Board</div>
        <div className="p-3 text-gray-600">Analytics</div>
        <div className="p-3 text-gray-600">Settings</div>
      </nav>

      <div className="mt-auto border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full cursor-pointer rounded-lg p-3 text-left font-medium text-red-600 transition hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
