
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/overview" },
    { name: "Inbox", href: "/inbox" },
  ];

  return (
    <aside className="w-64 shrink-0 rounded-xl bg-white p-6">
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
                ? "bg-[#eef1ff] text-[#4f6bff]"
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
    </aside>
  );
}
