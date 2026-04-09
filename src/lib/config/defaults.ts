/**
 * Config type definitions and hardcoded fallback values.
 * When config files are absent, the system uses these defaults —
 * identical behavior to before Sprint 0.
 */

// ── Type definitions ────────────────────────────────────────────────

export interface InstanceIdentity {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  domain: string;
  linkedInUrl?: string;
  logoPath: string;
  markText: string;
  accentColor?: string;
  copyright?: string;
  serviceChips?: string[];
  fonts?: {
    body: string;
    display: string;
    mono: string;
  };
  analytics?: {
    plausibleDomain?: string;
    plausibleSrc?: string;
  };
}

export interface InstancePrompts {
  personality?: string;
  heroHeading?: string;
  heroSubheading?: string;
  firstMessage?: {
    default?: string;
    withReferral?: string;
  };
  defaultSuggestions?: string[];
  referralSuggestions?: string[];
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  lane: "organization" | "individual" | "both";
  estimatedPrice?: number;
  estimatedHours?: number;
}

export interface InstanceServices {
  offerings: ServiceOffering[];
  bookingEnabled: boolean;
}

export interface InstanceTools {
  enabled?: string[];
  disabled?: string[];
}

export interface FullInstanceConfig {
  identity: InstanceIdentity;
  prompts: InstancePrompts;
  services: InstanceServices;
  tools: InstanceTools;
}

// ── Default values (extracted from pre-Sprint-0 hardcoded constants) ─

export const DEFAULT_IDENTITY: InstanceIdentity = {
  name: "Studio Ordo",
  shortName: "Ordo",
  tagline: "Conversation-First AI Workspaces",
  description:
    "A conversation-first AI workspace for teams that need trusted search, visual thinking, and QR-powered referrals in one place.",
  domain: "studioordo.com",
  logoPath: "/ordo-avatar.png",
  markText: "O",
  copyright: "© 2026 Studio Ordo. All rights reserved.",
  serviceChips: [
    "Conversation-First Workspaces",
    "Trusted Library Search",
    "QR Referrals",
  ],
  fonts: {
    body: "IBM Plex Sans",
    display: "Fraunces",
    mono: "IBM Plex Mono",
  },
};

export const DEFAULT_PROMPTS: InstancePrompts = {
  heroHeading: "Bring the mess. We'll make it move.",
  heroSubheading:
    "Studio Ordo is a conversation-first workspace for teams working with AI. Search the library, map live workflows, generate charts and audio, and use QR-powered referrals to bring the right people in.",
  firstMessage: {
    default:
      "Bring me the messy workflow, bold idea, or half-finished handoff. I can help you map it, search the library, turn it into visuals, or explain the QR referral system.",
    withReferral:
      "Welcome — {{referrer.name}} sent you here for a reason. I can show you what makes {{brand.name}} different, explain the QR referral system, or jump straight into the work.",
  },
  defaultSuggestions: [
    "Audit this workflow",
    "Search the library",
    "Show me something visual",
    "Explain the QR referral system",
  ],
  referralSuggestions: [
    "How does the QR referral system work?",
    "What makes this different?",
    "Show me the library",
    "What unlocks after I register?",
  ],
};

export const DEFAULT_SERVICES: InstanceServices = {
  offerings: [],
  bookingEnabled: false,
};

export const DEFAULT_TOOLS: InstanceTools = {};

export const DEFAULT_CONFIG: FullInstanceConfig = {
  identity: DEFAULT_IDENTITY,
  prompts: DEFAULT_PROMPTS,
  services: DEFAULT_SERVICES,
  tools: DEFAULT_TOOLS,
};
