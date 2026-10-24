
import Link from "next/link";

export default function TicketSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#4f6bff] p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-xl">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl text-green-600">✓</span>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Ticket Successfully Submitted!
        </h1>

        <p className="mt-4 text-gray-600">
          Thank you for contacting us. Your support request has
          been received and will be reviewed by our team.
        </p>

        <Link
          href="/submit/demo"
          className="mt-8 inline-block rounded-lg bg-[#4f6bff] px-6 py-3 font-semibold text-white transition hover:bg-[#4058e8]"
        >
          Submit Another Ticket
        </Link>

        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Return to Home
          </Link>
        </div>

      </div>
    </main>
  );
}
