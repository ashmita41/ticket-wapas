export type SampleClaimStatus = "paid" | "processing";

export type SampleClaim = {
  id: string;
  ticket: string;
  route: string;
  amount: number;
  status: SampleClaimStatus;
  updated: string;
  destination: string;
};

export const SAMPLE_CLAIMS_STORAGE_KEY = "ticket-wapas.sample-claims.v1";

export const fallbackSampleClaims: SampleClaim[] = [
  { id: "TW-RS-824", ticket: "PNR 2468135790", route: "New Delhi → Dibrugarh", amount: 4860, status: "paid", updated: "07 Sep 2026 · 6:18 PM", destination: "UPI · asha.rail@okaxis" },
  { id: "TW-HELP-2714", ticket: "PNR 7351902468", route: "Jaipur → Ahmedabad", amount: 1280, status: "processing", updated: "07 Sep 2026 · 5:04 PM", destination: "Assisted review pending" },
];

function isSampleClaim(value: unknown): value is SampleClaim {
  if (!value || typeof value !== "object") return false;
  const claim = value as Partial<SampleClaim>;
  return typeof claim.id === "string"
    && typeof claim.ticket === "string"
    && typeof claim.route === "string"
    && typeof claim.amount === "number"
    && (claim.status === "paid" || claim.status === "processing")
    && typeof claim.updated === "string"
    && typeof claim.destination === "string";
}

export function readSampleClaims(): SampleClaim[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SAMPLE_CLAIMS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isSampleClaim).slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function writeSampleClaim(claim: SampleClaim) {
  if (typeof window === "undefined") return;
  try {
    const existing = readSampleClaims().filter((item) => item.id !== claim.id);
    window.localStorage.setItem(SAMPLE_CLAIMS_STORAGE_KEY, JSON.stringify([claim, ...existing].slice(0, 5)));
  } catch {
    // The journey still completes if private browsing or device policy blocks storage.
  }
}
