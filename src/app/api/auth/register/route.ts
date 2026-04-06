import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { register } from "@/lib/auth";
import {
  ValidationError,
  DuplicateEmailError,
} from "@/core/use-cases/RegisterUserInteractor";
import { migrateAnonymousConversationsToUser } from "@/lib/chat/migrate-anonymous-conversations";
import {
  evaluatePublicFormRequest,
  PUBLIC_FORM_HONEYPOT_FIELD_NAME,
  PUBLIC_FORM_STARTED_AT_FIELD_NAME,
} from "@/lib/security/public-form-protection";

function buildProtectedResponse(error: string, status: number, retryAfterSeconds?: number) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
    },
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    const protectionResult = evaluatePublicFormRequest({
      surface: "auth-register",
      headers: req.headers,
      identifier: email,
      honeypotValue: body[PUBLIC_FORM_HONEYPOT_FIELD_NAME],
      startedAt: body[PUBLIC_FORM_STARTED_AT_FIELD_NAME],
    });

    if (!protectionResult.ok) {
      return buildProtectedResponse(
        protectionResult.error,
        protectionResult.status,
        protectionResult.retryAfterSeconds,
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "email, password, and name are required" },
        { status: 400 },
      );
    }

    const result = await register({ email, password, name });

    await migrateAnonymousConversationsToUser(result.user.id, "registration");

    // Set session cookie only after anonymous migration succeeds.
    const cookieStore = await cookies();
    cookieStore.set("lms_session_token", result.sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof DuplicateEmailError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
