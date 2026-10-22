import Image from "next/image";


export default function Sidebar() {
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
                <div className="rounded-lg bg-[#eef1ff] p-3 text-[#4f6bff]">
                    Overview
                </div>
                <div className="p-3 text-gray-600">Inbox</div>
                <div className="p-3 text-gray-600">Ticket Board</div>
                <div className="p-3 text-gray-600">Analytics</div>
                <div className="p-3 text-gray-600">Settings</div>
            </nav>
        </aside>
    )
}

