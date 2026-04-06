"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createPublicFormMetadata,
  PUBLIC_FORM_HONEYPOT_FIELD_NAME,
  PUBLIC_FORM_STARTED_AT_FIELD_NAME,
} from "@/lib/security/public-form-protection";

const HONEYPOT_STYLE = {
  position: "absolute",
  left: "-10000px",
  top: "auto",
  width: "1px",
  height: "1px",
  overflow: "hidden",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [{ honeypotValue, startedAt }] = useState(() => createPublicFormMetadata());
  const [honeypotInput, setHoneypotInput] = useState(honeypotValue);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          [PUBLIC_FORM_HONEYPOT_FIELD_NAME]: honeypotInput,
          [PUBLIC_FORM_STARTED_AT_FIELD_NAME]: startedAt,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Login failed");
        setPassword(""); // Clear password on failure, retain email
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-(--container-padding)">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
          <p className="text-sm opacity-50">
            Return to your saved workspace, conversations, and referral activity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div role="alert" aria-live="assertive" className="alert-error" style={error ? undefined : { display: "none" }}>
            {error}
          </div>

          <div aria-hidden="true" style={HONEYPOT_STYLE}>
            <label htmlFor={PUBLIC_FORM_HONEYPOT_FIELD_NAME}>Website</label>
            <input
              id={PUBLIC_FORM_HONEYPOT_FIELD_NAME}
              name={PUBLIC_FORM_HONEYPOT_FIELD_NAME}
              type="text"
              value={honeypotInput}
              onChange={(e) => setHoneypotInput(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
            />
            <input
              type="hidden"
              name={PUBLIC_FORM_STARTED_AT_FIELD_NAME}
              value={startedAt}
              readOnly
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs opacity-50">
          Need an account to save your workspace?{" "}
          <Link href="/register" className="font-bold opacity-100 text-accent-interactive hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
