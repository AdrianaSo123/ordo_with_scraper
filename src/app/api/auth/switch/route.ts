import { NextResponse } from "next/server";
import { setMockSession, type RoleName } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { role } = await req.json();

    const allowedRoles: RoleName[] = [
      "ANONYMOUS",
      "AUTHENTICATED",
      "STAFF",
      "ADMIN",
    ];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided." },
        { status: 400 },
      );
    }

    // Set the cookie via standard Next.js approach
    await setMockSession(role as RoleName);

    return NextResponse.json({ success: true, activeRole: role });
  } catch (error) {
    console.error("Failed to switch role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
