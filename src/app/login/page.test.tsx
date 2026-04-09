import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PUBLIC_FORM_HONEYPOT_FIELD_NAME,
  PUBLIC_FORM_STARTED_AT_FIELD_NAME,
} from "@/lib/security/public-form-protection";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
      refresh: refreshMock,
    }),
  };
});

import LoginPage from "./page";

describe("/login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("redirects successful logins to the chat homepage", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: "usr_auth" } }),
    } as Response);

    render(<LoginPage />);

    const honeypotField = document.querySelector(
      `input[name="${PUBLIC_FORM_HONEYPOT_FIELD_NAME}"]`,
    ) as HTMLInputElement | null;
    const startedAtField = document.querySelector(
      `input[name="${PUBLIC_FORM_STARTED_AT_FIELD_NAME}"]`,
    ) as HTMLInputElement | null;

    expect(honeypotField).not.toBeNull();
    expect(startedAtField?.value).toMatch(/^\d+$/);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "auth@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    const fetchPayload = JSON.parse(
      ((vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined)?.body as string) ?? "{}",
    ) as Record<string, string>;

    expect(fetchPayload).toMatchObject({
      email: "auth@example.com",
      password: "password123",
      [PUBLIC_FORM_HONEYPOT_FIELD_NAME]: "",
    });
    expect(fetchPayload[PUBLIC_FORM_STARTED_AT_FIELD_NAME]).toBe(startedAtField?.value);
  });
});