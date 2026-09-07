export type OriginalPayment =
  | { kind: "cash" }
  | { kind: "pos"; maskedDestination: string };

export type PrsTicketRecord = {
  pnr: string;
  trainNumber: string;
  journeyDate: string;
  origin: string;
  destination: string;
  passengerCount: number;
  claimantName: string;
  linkedMobileMasked: string | null;
  originalPayment: OriginalPayment;
  refundAmount: number;
};

export type CancellationEvent = {
  id: string;
  status: "final_cancelled" | "restored" | "pending_finality";
  decidedAt: string;
};

export type RefundDestination = {
  kind: "original" | "upi" | "bank";
  maskedLabel: string;
  beneficiaryName: string;
  nameMatched: boolean;
};

export type RemoteSurrenderReceipt = {
  claimKey: string;
  reference: string;
  pnrMasked: string;
  route: string;
  journeyDate: string;
  cancellationEventId: string;
  cancellationConfirmedAt: string;
  surrenderRecordedAt: string;
  amount: number;
  destination: RefundDestination | null;
  status: "remote_surrender_recorded" | "refund_instructed" | "paid";
  paymentReference: string | null;
};

export type RemoteSurrenderRequest = {
  record: PrsTicketRecord;
  cancellationEvent: CancellationEvent;
  otpVerified: boolean;
  possessionConfirmed: boolean;
  consentGiven: boolean;
};

const RECEIPT_STORAGE_KEY = "ticket-wapas.remote-surrender.v2";

const prsRecords: PrsTicketRecord[] = [
  {
    pnr: "2468135790",
    trainNumber: "12424",
    journeyDate: "2026-08-24",
    origin: "New Delhi",
    destination: "Dibrugarh",
    passengerCount: 1,
    claimantName: "Asha P.",
    linkedMobileMasked: "+91 •••••• 2714",
    originalPayment: { kind: "cash" },
    refundAmount: 4860,
  },
  {
    pnr: "7351902468",
    trainNumber: "12958",
    journeyDate: "2026-08-24",
    origin: "Jaipur",
    destination: "Ahmedabad",
    passengerCount: 1,
    claimantName: "Meera K.",
    linkedMobileMasked: null,
    originalPayment: { kind: "cash" },
    refundAmount: 1280,
  },
  {
    pnr: "6193048275",
    trainNumber: "12310",
    journeyDate: "2026-08-24",
    origin: "Patna",
    destination: "New Delhi",
    passengerCount: 2,
    claimantName: "Ravi K.",
    linkedMobileMasked: "+91 •••••• 1842",
    originalPayment: { kind: "cash" },
    refundAmount: 2145,
  },
  {
    pnr: "9911223344",
    trainNumber: "12002",
    journeyDate: "2026-08-24",
    origin: "New Delhi",
    destination: "Rani Kamlapati",
    passengerCount: 1,
    claimantName: "Aman S.",
    linkedMobileMasked: "+91 •••••• 6620",
    originalPayment: { kind: "pos", maskedDestination: "Original Visa card · •••• 6620" },
    refundAmount: 1765,
  },
  {
    pnr: "8844001122",
    trainNumber: "12230",
    journeyDate: "2026-08-24",
    origin: "New Delhi",
    destination: "Lucknow",
    passengerCount: 1,
    claimantName: "Nisha R.",
    linkedMobileMasked: "+91 •••••• 4410",
    originalPayment: { kind: "cash" },
    refundAmount: 945,
  },
];

const cancellationEvents: Record<string, CancellationEvent> = {
  "2468135790": { id: "CAN-12424-20260824", status: "final_cancelled", decidedAt: "23 Aug 2026 · 6:42 PM" },
  "7351902468": { id: "CAN-12958-20260824", status: "final_cancelled", decidedAt: "23 Aug 2026 · 8:16 PM" },
  "6193048275": { id: "CAN-12310-20260824", status: "final_cancelled", decidedAt: "23 Aug 2026 · 7:05 PM" },
  "9911223344": { id: "CAN-12002-20260824", status: "final_cancelled", decidedAt: "23 Aug 2026 · 5:38 PM" },
  "8844001122": { id: "CAN-12230-20260824", status: "restored", decidedAt: "Service restored · 23 Aug 2026 · 9:10 PM" },
};

function claimKey(record: PrsTicketRecord, event: CancellationEvent) {
  return `PRS:${record.pnr}:${record.journeyDate}:${event.id}`;
}

function maskPnr(pnr: string) {
  return `${pnr.slice(0, 2)}••••••${pnr.slice(-2)}`;
}

function readReceipts(): RemoteSurrenderReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECEIPT_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is RemoteSurrenderReceipt => Boolean(item && typeof item === "object" && "claimKey" in item && "reference" in item))
      : [];
  } catch {
    return [];
  }
}

function writeReceipt(receipt: RemoteSurrenderReceipt) {
  if (typeof window === "undefined") return;
  try {
    const others = readReceipts().filter((item) => item.claimKey !== receipt.claimKey);
    window.localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify([receipt, ...others].slice(0, 10)));
  } catch {
    // The synthetic journey still works when a browser blocks local storage.
  }
}

export function getPrsTicketRecord(pnr: string, trainNumber: string, journeyDate: string) {
  return prsRecords.find((record) => record.pnr === pnr && record.trainNumber === trainNumber && record.journeyDate === journeyDate) ?? null;
}

export function getFinalCancellationEvent(record: PrsTicketRecord) {
  return cancellationEvents[record.pnr] ?? { id: `PENDING-${record.pnr}`, status: "pending_finality" as const, decidedAt: "Pending" };
}

export function verifyBookingMobile(record: PrsTicketRecord, otp: string) {
  if (!record.linkedMobileMasked) return { ok: false as const, reason: "no_booking_mobile" as const };
  return otp === "271406"
    ? { ok: true as const }
    : { ok: false as const, reason: "incorrect_code" as const };
}

export function getExistingRemoteSurrender(record: PrsTicketRecord, event: CancellationEvent) {
  return readReceipts().find((receipt) => receipt.claimKey === claimKey(record, event)) ?? null;
}

export function recordRemoteSurrender(request: RemoteSurrenderRequest) {
  const { record, cancellationEvent } = request;
  const key = claimKey(record, cancellationEvent);
  const existing = readReceipts().find((receipt) => receipt.claimKey === key);
  if (existing) return { receipt: existing, reused: true as const };
  if (cancellationEvent.status !== "final_cancelled") throw new Error("FINAL_CANCELLATION_REQUIRED");
  if (!request.otpVerified) throw new Error("BOOKING_MOBILE_REQUIRED");
  if (!request.possessionConfirmed) throw new Error("POSSESSION_PROOF_REQUIRED");
  if (!request.consentGiven) throw new Error("SURRENDER_CONSENT_REQUIRED");

  const receipt: RemoteSurrenderReceipt = {
    claimKey: key,
    reference: record.pnr === "2468135790" ? "TW-RS-824" : `TW-RS-${record.pnr.slice(-3)}`,
    pnrMasked: maskPnr(record.pnr),
    route: `${record.origin} → ${record.destination}`,
    journeyDate: record.journeyDate,
    cancellationEventId: cancellationEvent.id,
    cancellationConfirmedAt: cancellationEvent.decidedAt,
    surrenderRecordedAt: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    amount: record.refundAmount,
    destination: null,
    status: "remote_surrender_recorded",
    paymentReference: null,
  };
  writeReceipt(receipt);
  return { receipt, reused: false as const };
}

export function createRefundInstruction(receipt: RemoteSurrenderReceipt, destination: RefundDestination) {
  const current = readReceipts().find((item) => item.claimKey === receipt.claimKey) ?? receipt;
  if (current.destination && current.status !== "remote_surrender_recorded") {
    return { receipt: current, reused: true as const };
  }
  if (!destination.nameMatched) throw new Error("BENEFICIARY_REVIEW_REQUIRED");

  const updated: RemoteSurrenderReceipt = {
    ...current,
    destination,
    status: "refund_instructed",
  };
  writeReceipt(updated);
  return { receipt: updated, reused: false as const };
}

export function markRefundPaid(receipt: RemoteSurrenderReceipt) {
  const updated: RemoteSurrenderReceipt = {
    ...receipt,
    status: "paid",
    paymentReference: "4268•••914",
  };
  writeReceipt(updated);
  return updated;
}
