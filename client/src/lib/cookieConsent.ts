import { useEffect, useState } from "react";

export const CONSENT_VERSION = "1";
const STORAGE_KEY = "cookie-consent";
const EVENT_NAME = "cookie-consent-changed";
// Keep consent for 12 months — must match the retention stated in the
// public cookie policy (client/src/pages/legal/Cookies.tsx).
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentChoice = "all" | "necessary";

export interface ConsentState {
  version: string;
  choice: ConsentChoice;
  timestamp: number;
  categories: {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
  };
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp > CONSENT_TTL_MS
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    choice,
    timestamp: Date.now(),
    categories: {
      necessary: true,
      analytics: choice === "all",
      marketing: choice === "all",
    },
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
  return state;
}

export function clearConsent(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
}

export function openCookieSettings(): void {
  window.dispatchEvent(new CustomEvent("cookie-consent-open"));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(() => readConsent());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState | null>).detail;
      setConsent(detail ?? readConsent());
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return {
    consent,
    hasConsent: consent !== null,
    analyticsAllowed: consent?.categories.analytics ?? false,
    marketingAllowed: consent?.categories.marketing ?? false,
    acceptAll: () => saveConsent("all"),
    acceptNecessary: () => saveConsent("necessary"),
    reset: clearConsent,
  };
}
