import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/core/entities/user";
import type * as ThemeProviderModule from "@/components/ThemeProvider";
import type * as ReactDOMModule from "react-dom";

const {
  logoutMock,
  setAccessibilityMock,
  setIsDarkMock,
  switchRoleMock,
  usePathnameMock,
  useSearchParamsMock,
} = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  setAccessibilityMock: vi.fn(),
  setIsDarkMock: vi.fn(),
  switchRoleMock: vi.fn(),
  usePathnameMock: vi.fn(),
  useSearchParamsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  useSearchParams: useSearchParamsMock,
}));

vi.mock("@/hooks/useMockAuth", () => ({
  useMockAuth: () => ({ logout: logoutMock, switchRole: switchRoleMock }),
}));

vi.mock("@/components/ThemeProvider", async () => {
  const actual = await vi.importActual<typeof ThemeProviderModule>("@/components/ThemeProvider");

  return {
    ...actual,
    useTheme: () => ({
      isDark: false,
      setIsDark: setIsDarkMock,
      accessibility: {
        fontSize: "md",
        lineHeight: "normal",
        letterSpacing: "normal",
        density: "normal",
        colorBlindMode: "none",
      },
      setAccessibility: setAccessibilityMock,
    }),
  };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof ReactDOMModule>("react-dom");

  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

import { ShellWorkspaceMenu } from "@/components/ShellWorkspaceMenu";

const anonymousUser: User = {
  id: "usr_anon",
  email: "",
  name: "Anonymous User",
  roles: ["ANONYMOUS"],
};

describe("ShellWorkspaceMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/");
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("shows login and register links for anonymous users", () => {
    render(<ShellWorkspaceMenu user={anonymousUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Open workspace menu" }));

    expect(screen.getByText("Login or register to save conversations, unlock richer tools, and track referrals.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("link", { name: "Sign In" })).toBeNull();
  });
});