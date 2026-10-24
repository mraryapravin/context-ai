
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#4f6bff] px-6 py-12">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-10 text-center shadow-xl">
        <div className="mb-6 flex justify-center">
          <Image
            src="/context-logo.png"
            alt="Context AI"
            width={240}
            height={140}
            className="h-auto w-48"
            priority
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Customer support, made smarter.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          Context AI helps businesses organise customer requests,
          prioritise urgent issues, and deliver better support.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/submit/demo"
            className="rounded-xl bg-[#4f6bff] p-6 text-white transition hover:bg-[#4058e8]"
          >
            <h2 className="text-xl font-semibold">
              Submit a Ticket
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Have a question or issue? Send us a support request.
            </p>
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-900 transition hover:bg-gray-100"
          >
            <h2 className="text-xl font-semibold">
              Staff Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your support dashboard and manage tickets.
            </p>
          </Link>
        </div>

        <p className="mt-10 text-xs text-gray-400">
          Powered by Context AI   -   By Arya Pravin
        </p>
      </div>
    </main>
  );
}
