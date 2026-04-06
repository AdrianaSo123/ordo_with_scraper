import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRouteRequest } from "../../../../../tests/helpers/workflow-route-fixture";
import {
  PUBLIC_FORM_HONEYPOT_FIELD_NAME,
  resetPublicFormProtectionState,
} from "@/lib/security/public-form-protection";

const { getLeadCaptureInteractorMock, resolveUserIdMock, submitCaptureMock } = vi.hoisted(() => ({
  getLeadCaptureInteractorMock: vi.fn(),
  resolveUserIdMock: vi.fn(),
  submitCaptureMock: vi.fn(),
}));

vi.mock("@/lib/chat/conversation-root", () => ({
  getLeadCaptureInteractor: getLeadCaptureInteractorMock,
}));

vi.mock("@/lib/chat/resolve-user", () => ({
  resolveUserId: resolveUserIdMock,
}));

import { POST } from "./route";

function makeRequest(body: unknown, headers?: HeadersInit) {
  return createRouteRequest("http://localhost:3000/api/chat/contact-capture", "POST", body, headers);
}

describe("POST /api/chat/contact-capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPublicFormProtectionState();
    resolveUserIdMock.mockResolvedValue({ userId: "usr_test", isAnonymous: false });
    getLeadCaptureInteractorMock.mockReturnValue({
      submitCapture: submitCaptureMock,
    });
    submitCaptureMock.mockResolvedValue({
      id: "lead_1",
      conversationId: "conv_1",
      lane: "development",
    });
  });

  it("accepts the development lane at the API boundary", async () => {
    const response = await POST(makeRequest({
      conversationId: "conv_1",
      lane: "development",
      name: "Alex Rivera",
      email: "alex@example.com",
      organization: "Northwind Labs",
      roleOrTitle: "COO",
      problemSummary: "Need implementation help",
      recommendedNextAction: "Offer scoping call",
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(submitCaptureMock).toHaveBeenCalledWith("usr_test", expect.objectContaining({
      conversationId: "conv_1",
      lane: "development",
    }));
    expect(payload.ok).toBe(true);
    expect(payload.leadRecord).toMatchObject({
      conversationId: "conv_1",
      lane: "development",
    });
  });

  it("rejects invalid lane values", async () => {
    const response = await POST(makeRequest({
      conversationId: "conv_1",
      lane: "enterprise",
      name: "Alex Rivera",
      email: "alex@example.com",
    }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("lane must be valid.");
    expect(submitCaptureMock).not.toHaveBeenCalled();
  });

  it("rejects honeypot capture submissions", async () => {
    const response = await POST(makeRequest({
      conversationId: "conv_1",
      lane: "development",
      name: "Alex Rivera",
      email: "alex@example.com",
      [PUBLIC_FORM_HONEYPOT_FIELD_NAME]: "https://spam.invalid",
    }, { "x-forwarded-for": "203.0.113.31" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Unable to process request.");
    expect(submitCaptureMock).not.toHaveBeenCalled();
  });

  it("rate limits repeated capture submissions from the same client", async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await POST(makeRequest({
        conversationId: "conv_1",
        lane: "development",
        name: "Alex Rivera",
        email: "alex@example.com",
      }, { "x-forwarded-for": "203.0.113.32" }));

      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(makeRequest({
      conversationId: "conv_1",
      lane: "development",
      name: "Alex Rivera",
      email: "alex@example.com",
    }, { "x-forwarded-for": "203.0.113.32" }));
    const payload = await limitedResponse.json();

    expect(limitedResponse.status).toBe(429);
    expect(payload.error).toBe("Too many attempts. Please wait a moment and try again.");
    expect(limitedResponse.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(submitCaptureMock).toHaveBeenCalledTimes(6);
  });
});