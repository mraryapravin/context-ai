
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { classifyTicket } from "@/lib/ai/classify-ticket";

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
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request" },
        { status: 400 }
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const { title, description, priority } = input;

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

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or fewer" },
        { status: 400 }
      );
    }

    if (cleanDescription.length > 5000) {
      return NextResponse.json(
        { error: "Description must be 5000 characters or fewer" },
        { status: 400 }
      );
    }

    const customerPriority =
      priority === "LOW" || priority === "HIGH"
        ? priority
        : "MEDIUM";

    // Attempt AI classification before saving the ticket.
    // If the AI service fails, the customer can still submit.
    let classification = null;

    try {
      classification = await classifyTicket(
        cleanTitle,
        cleanDescription
      );
    } catch (error) {
      console.error("AI classification failed:", error);
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: cleanTitle,
        description: cleanDescription,
        priority: customerPriority,

        aiUrgency: classification?.urgency ?? null,
        aiSentiment: classification?.sentiment ?? null,
        aiEscalationRisk:
          classification?.escalationRisk ?? null,
        aiReason: classification?.reason ?? null,
        aiSummary: classification?.summary ?? null,
        aiRecommendedActions: classification?.recommendedActions ?? [],
        aiCommunicationGuidance:
        classification?.communicationGuidance ?? null,
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
