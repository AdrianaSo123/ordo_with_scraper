export const PUBLIC_FORM_HONEYPOT_FIELD_NAME = "website";
export const PUBLIC_FORM_STARTED_AT_FIELD_NAME = "formStartedAt";

type ProtectedSurface = "auth-login" | "auth-register" | "chat-contact-capture";
type FailureCode = "rate_limited" | "honeypot" | "too_fast";

interface SurfacePolicy {
  windowMs: number;
  maxAttempts: number;
  minimumFillMs: number;
}

const SURFACE_POLICIES: Record<ProtectedSurface, SurfacePolicy> = {
  "auth-login": {
    windowMs: 10 * 60_000,
    maxAttempts: 8,
    minimumFillMs: 0,
  },
  "auth-register": {
    windowMs: 30 * 60_000,
    maxAttempts: 4,
    minimumFillMs: 1_500,
  },
  "chat-contact-capture": {
    windowMs: 15 * 60_000,
    maxAttempts: 6,
    minimumFillMs: 0,
  },
};

const rateLimitStore = new Map<string, number[]>();

export interface PublicFormMetadata {
  honeypotValue: string;
  startedAt: string;
}

export interface PublicFormProtectionFailure {
  ok: false;
  code: FailureCode;
  error: string;
  status: number;
  retryAfterSeconds?: number;
}

export interface PublicFormProtectionSuccess {
  ok: true;
}

interface EvaluatePublicFormRequestOptions {
  surface: ProtectedSurface;
  headers: Headers;
  identifier?: string | null;
  honeypotValue?: unknown;
  startedAt?: unknown;
  now?: number;
}

export function createPublicFormMetadata(now = Date.now()): PublicFormMetadata {
  return {
    honeypotValue: "",
    startedAt: String(now),
  };
}

export function evaluatePublicFormRequest(
  options: EvaluatePublicFormRequestOptions,
): PublicFormProtectionFailure | PublicFormProtectionSuccess {
  const policy = SURFACE_POLICIES[options.surface];
  const now = options.now ?? Date.now();
  const identifier = normalizeIdentifier(options.identifier);
  const rateLimitKey = createRateLimitKey(options.surface, options.headers, identifier);
  const activeAttempts = pruneAttempts(rateLimitStore.get(rateLimitKey) ?? [], now, policy.windowMs);

  if (activeAttempts.length >= policy.maxAttempts) {
    if (activeAttempts.length > 0) {
      rateLimitStore.set(rateLimitKey, activeAttempts);
    } else {
      rateLimitStore.delete(rateLimitKey);
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(((activeAttempts[0] ?? now) + policy.windowMs - now) / 1000),
    );

    return {
      ok: false,
      code: "rate_limited",
      error: "Too many attempts. Please wait a moment and try again.",
      status: 429,
      retryAfterSeconds,
    };
  }

  activeAttempts.push(now);
  rateLimitStore.set(rateLimitKey, activeAttempts);

  const honeypotValue = typeof options.honeypotValue === "string" ? options.honeypotValue.trim() : "";
  if (honeypotValue) {
    return {
      ok: false,
      code: "honeypot",
      error: "Unable to process request.",
      status: 400,
    };
  }

  if (policy.minimumFillMs > 0) {
    const startedAt = parseStartedAt(options.startedAt);
    if (!startedAt || now - startedAt < policy.minimumFillMs) {
      return {
        ok: false,
        code: "too_fast",
        error: "Please wait a moment and try again.",
        status: 400,
      };
    }
  }

  return { ok: true };
}

export function resetPublicFormProtectionState() {
  rateLimitStore.clear();
}

function createRateLimitKey(surface: ProtectedSurface, headers: Headers, identifier: string | null): string {
  const clientIp = getClientIp(headers);
  return `${surface}:${clientIp}:${identifier ?? "anonymous"}`;
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstForwarded = forwarded.split(",")[0]?.trim();
    if (firstForwarded) {
      return firstForwarded;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const connectingIp = headers.get("cf-connecting-ip")?.trim();
  if (connectingIp) {
    return connectingIp;
  }

  return "unknown";
}

function normalizeIdentifier(identifier: string | null | undefined): string | null {
  if (!identifier) {
    return null;
  }

  const normalized = identifier.trim().toLowerCase();
  return normalized || null;
}

function parseStartedAt(startedAt: unknown): number | null {
  if (typeof startedAt === "number" && Number.isFinite(startedAt) && startedAt > 0) {
    return startedAt;
  }

  if (typeof startedAt === "string") {
    const parsed = Number.parseInt(startedAt, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function pruneAttempts(attempts: number[], now: number, windowMs: number): number[] {
  return attempts.filter((attempt) => now - attempt < windowMs);
}