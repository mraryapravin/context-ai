
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

type Author = {
  type: "STAFF" | "CUSTOMER";
  name: string;
};

function validCustomerToken(
  token: string,
  storedHash: string | null
): boolean {
  if (
    !storedHash ||
    !/^[a-f0-9]{64}$/.test(token) ||
    !/^[a-f0-9]{64}$/.test(storedHash)
  ) {
    return false;
  }

  const suppliedHash = createHash("sha256")
    .update(token)
    .digest();

  const expectedHash = Buffer.from(
    storedHash,
    "hex"
  );

  return timingSafeEqual(
    suppliedHash,
    expectedHash
  );
}

async function authoriseTicket(
  request: NextRequest,
  ticketId: string
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      customerAccessTokenHash: true,
    },
  });

  if (!ticket) {
    return null;
  }

  const customerToken = request.headers.get(
    "x-ticket-access-token"
  );

  let author: Author;

  if (customerToken !== null) {
    if (
      !validCustomerToken(
        customerToken,
        ticket.customerAccessTokenHash
      )
    ) {
      return null;
    }

    author = {
      type: "CUSTOMER",
      name: "Customer",
    };
  } else {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    author = {
      type: "STAFF",
      name: session.user.name || "Support Agent",
    };
  }

  return { ticket, author };
}

// GET — Retrieve the conversation.
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { ticketId } = await params;

    const access = await authoriseTicket(
      request,
      ticketId
    );

    if (!access) {
      return NextResponse.json(
        { error: "Ticket not found or access denied." },
        { status: 404 }
      );
    }

    const messages =
      await prisma.ticketMessage.findMany({
        where: { ticketId },
        orderBy: [
          { createdAt: "asc" },
          { id: "asc" },
        ],
        select: {
          id: true,
          authorType: true,
          authorName: true,
          body: true,
          createdAt: true,
        },
      });

    return NextResponse.json(
      {
        ticket: {
          id: access.ticket.id,
          title: access.ticket.title,
          description: access.ticket.description,
          status: access.ticket.status,
          createdAt: access.ticket.createdAt,
        },
        messages,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to load messages:", error);

    return NextResponse.json(
      { error: "Failed to load conversation." },
      { status: 500 }
    );
  }
}

// POST — Staff or the ticket owner can send a message.
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { ticketId } = await params;

    const access = await authoriseTicket(
      request,
      ticketId
    );

    if (!access) {
      return NextResponse.json(
        { error: "Ticket not found or access denied." },
        { status: 404 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("message" in body) ||
      typeof body.message !== "string"
    ) {
      return NextResponse.json(
        { error: "Message text is required." },
        { status: 400 }
      );
    }

    const cleanMessage = body.message.trim();

    if (!cleanMessage || cleanMessage.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Message must contain 1 to 5000 characters.",
        },
        { status: 400 }
      );
    }

    const newMessage = await prisma.$transaction(
      async (tx) => {
        const created = await tx.ticketMessage.create({
          data: {
            ticketId,
            authorType: access.author.type,
            authorName: access.author.name,
            body: cleanMessage,
          },
        });

        // A customer replying to a resolved ticket
        // means the issue needs attention again.
        if (
          access.author.type === "CUSTOMER" &&
          access.ticket.status === "RESOLVED"
        ) {
          await tx.ticket.update({
            where: { id: ticketId },
            data: { status: "OPEN" },
          });
        }

        return created;
      }
    );

    return NextResponse.json(
      {
        message: "Reply sent successfully.",
        reply: newMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to send message:", error);

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
