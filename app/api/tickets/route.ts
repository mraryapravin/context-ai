import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// GET FUNCTION
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany();

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets:", error);

    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}


// POST FUNCTION

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

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Failed to create ticket:", error);

    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
