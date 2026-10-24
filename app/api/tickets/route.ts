
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET — Only logged-in staff can view tickets
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorised. Staff login required." },
        { status: 401 }
      );
    }

    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets:", error);

    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST — Customers can submit tickets without logging in
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { title, description, priority } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    if (title.trim().length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or fewer" },
        { status: 400 }
      );
    }

    if (description.trim().length > 5000) {
      return NextResponse.json(
        { error: "Description must be 5000 characters or fewer" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        priority:
          priority === "LOW" || priority === "HIGH"
            ? priority
            : "MEDIUM",
      },
    });

    return NextResponse.json(
      {
        message: "Ticket submitted successfully",
        ticketId: ticket.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create ticket:", error);

    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
