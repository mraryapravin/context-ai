
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/overview" },
    { name: "Ticket Inbox", href: "/inbox" },
  ];

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col self-stretch rounded-xl bg-white p-6">
      <Link href="/overview" aria-label="Go to Dashboard">
        <Image
          src="/context-logo.png"
          alt="Context AI"
          width={240}
          height={140}
          className="h-auto w-40"
        />
      </Link>

      <nav className="mt-10 flex flex-col gap-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-lg p-3 text-base transition ${
                isActive
                  ? "bg-[#eef1ff] font-semibold text-[#4f6bff]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.name}
            </Link>
          );
        })}

        <div className="rounded-lg p-3 text-base text-gray-500">
          Analytics
        </div>

        <div className="rounded-lg p-3 text-base text-gray-500">
          Settings
        </div>

        {/* SIGN OUT DIRECTLY BELOW SETTINGS */}
        <div className="mt-2 border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full cursor-pointer rounded-lg p-3 text-left text-base font-semibold text-red-600 transition hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
}
