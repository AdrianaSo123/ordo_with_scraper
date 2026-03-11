import type { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth";
import {
  runRouteTemplate,
  successJson,
  errorJson,
} from "@/lib/chat/http-facade";
import { getConversationInteractor } from "@/lib/chat/conversation-root";

const SESSION_COOKIE = "lms_session_token";

export async function GET(request: NextRequest) {
  return runRouteTemplate({
    route: "/api/conversations",
    request,
    validationMessages: [],
    execute: async (context) => {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (!token) {
        return errorJson(context, "Authentication required", 401);
      }

      const user = await validateSession(token);
      const interactor = getConversationInteractor();
      const conversations = await interactor.list(user.id);

      return successJson(context, { conversations });
    },
  });
}

export async function POST(request: NextRequest) {
  return runRouteTemplate({
    route: "/api/conversations",
    request,
    validationMessages: [],
    execute: async (context) => {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (!token) {
        return errorJson(context, "Authentication required", 401);
      }

      const user = await validateSession(token);
      const body = (await request.json()) as { title?: string };
      const interactor = getConversationInteractor();
      const conversation = await interactor.create(user.id, body.title || "");

      return successJson(context, { conversation }, { status: 201 });
    },
  });
}
