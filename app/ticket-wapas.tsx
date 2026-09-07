"use client";

import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import { SampleClaim, writeSampleClaim } from "./sample-claims";
import {
  CancellationEvent,
  PrsTicketRecord,
  RefundDestination,
  RemoteSurrenderReceipt,
  createRefundInstruction,
  getExistingRemoteSurrender,
  getFinalCancellationEvent,
  getPrsTicketRecord,
  markRefundPaid,
  recordRemoteSurrender,
  verifyBookingMobile,
} from "./mock-refund-service";

type Screen =
  | "home"
  | "capture"
  | "details"
  | "eligibility"
  | "otp"
  | "assisted"
  | "surrender"
  | "payout"
  | "review"
  | "tracking";

type Lang = "en" | "hi";
type Payout = "upi" | "bank";
type TicketType = "prs" | "uts";
type SurrenderStage = "ready" | "matched" | "recorded";
type ConfidenceStatus = "extracted" | "unclear" | "missing";
type RequiredTicketField = "identifier" | "trainNumber" | "date" | "origin" | "destination" | "fare";
type AnalysisState = "idle" | "reading" | "done" | "fallback" | "rejected";
type AssistedReason = "mobile" | "multi_passenger" | "beneficiary" | "record";
type EligibilityIssue = "record_not_found" | "not_final" | null;

type TicketData = {
  ticketType: TicketType;
  identifier: string;
  trainNumber: string;
  trainName: string;
  date: string;
  origin: string;
  destination: string;
  passengers: number;
  fare: number;
  confidence: Record<RequiredTicketField, ConfidenceStatus>;
};

type ExtractedTicketPayload = {
  documentType?: "prs_counter_ticket" | "uts_counter_ticket" | "not_ticket" | "unclear";
  documentConfidence?: "high" | "medium" | "low";
  documentNotes?: string;
  pnr?: string | null;
  utsNumber?: string | null;
  trainNumber?: string | null;
  trainName?: string | null;
  date?: string | null;
  origin?: string | null;
  destination?: string | null;
  passengers?: number | null;
  fare?: number | null;
  confidence?: Partial<Record<"pnr" | "utsNumber" | Exclude<RequiredTicketField, "identifier">, ConfidenceStatus>>;
};

const ticket: TicketData = {
  ticketType: "prs",
  identifier: "2468135790",
  trainNumber: "12424",
  trainName: "Rajdhani Express",
  date: "2026-08-24",
  origin: "New Delhi",
  destination: "Dibrugarh",
  passengers: 1,
  fare: 4860,
  confidence: {
    identifier: "extracted",
    trainNumber: "extracted",
    date: "extracted",
    origin: "extracted",
    destination: "extracted",
    fare: "extracted",
  },
};

const utsTicket: TicketData = {
  ticketType: "uts",
  identifier: "UTS7A4K219",
  trainNumber: "12056",
  trainName: "Jan Shatabdi",
  date: "2026-08-24",
  origin: "New Delhi",
  destination: "Dehradun",
  passengers: 1,
  fare: 165,
  confidence: {
    identifier: "extracted",
    trainNumber: "extracted",
    date: "extracted",
    origin: "extracted",
    destination: "extracted",
    fare: "extracted",
  },
};

function emptyTicket(ticketType: TicketType): TicketData {
  return {
    ticketType,
    identifier: "",
    trainNumber: "",
    trainName: "",
    date: "",
    origin: "",
    destination: "",
    passengers: 0,
    fare: 0,
    confidence: {
      identifier: "missing",
      trainNumber: "missing",
      date: "missing",
      origin: "missing",
      destination: "missing",
      fare: "missing",
    },
  };
}

const screens: Screen[] = ["home", "capture", "details", "eligibility", "otp", "surrender", "payout", "review", "tracking"];

const dictionary = {
  en: {
    strap: "COUNTER-TICKET REFUNDS, WITHOUT THE RETURN TRIP",
    hero: "The train was cancelled. Your refund journey should be too.",
    sub: "Check a cancelled counter ticket, confirm it belongs to you, and receive the refund digitally — without going back to the railway counter.",
    start: "Start refund journey",
    manual: "Enter ticket manually",
    proof: "Ownership checked before refund",
    back: "Back",
    continue: "Continue",
  },
  hi: {
    strap: "काउंटर टिकट रिफंड, बिना स्टेशन लौटे",
    hero: "ट्रेन रद्द हुई है। रिफंड के लिए सफ़र क्यों?",
    sub: "रद्द हुई काउंटर टिकट को जाँचें, मालिकाना साबित करें और रिफंड डिजिटल रूप से पाएँ — रेलवे काउंटर पर लौटे बिना।",
    start: "रिफंड प्रक्रिया शुरू करें",
    manual: "टिकट की जानकारी भरें",
    proof: "भुगतान से पहले सत्यापन",
    back: "पीछे",
    continue: "आगे बढ़ें",
  },
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    shield: <><path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    phone: <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></>,
    wallet: <><path d="M4 7V5a2 2 0 0 1 2-2h11v4"/><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    route: <><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17c7 0 3-10 10-10"/></>,
    ticket: <><path d="M4 6a2 2 0 0 0 0 4v4a2 2 0 0 0 0 4h16V6H4Z"/><path d="M14 6v12M8 10h3M8 14h2"/></>,
    alert: <><path d="m12 3 9 16H3l9-16Z"/><path d="M12 9v4M12 16h.01"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4 17a8 8 0 0 1 13-9l3 4M4 17v-5h5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h4"/></>,
    sparkle: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/></>,
  };
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span className="rail rail-one" />
      <span className="rail rail-two" />
      <span className="rail-dot" />
    </div>
  );
}

function StatusPill({ status, lang }: { status: "extracted" | "unclear" | "missing"; lang: Lang }) {
  const label = lang === "hi"
    ? status === "extracted" ? "मिल गया" : status === "unclear" ? "इसे जाँचें" : "ज़रूरी"
    : status === "extracted" ? "FOUND" : status === "unclear" ? "CHECK THIS" : "NEEDED";
  return <span className={`status-pill ${status}`}>{status === "extracted" && <Icon name="check" size={12} />}{label}</span>;
}

function Field({ label, value, lang, status = "extracted", optional = false, onChange, type = "text", inputMode, maxLength, placeholder, hint, error }: {
  label: string;
  value: string;
  lang: Lang;
  status?: ConfidenceStatus;
  optional?: boolean;
  onChange: (value: string) => void;
  type?: "text" | "date" | "number";
  inputMode?: "text" | "numeric" | "decimal";
  maxLength?: number;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className={`data-field ${status} ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}{optional ? <span className="status-pill optional">{lang === "hi" ? "वैकल्पिक" : "OPTIONAL"}</span> : <StatusPill status={status} lang={lang} />}</span>
      <input aria-label={label} type={type} inputMode={inputMode} maxLength={maxLength} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      {(error || hint) && <small className={error ? "field-error" : "field-hint"}>{error ?? hint}</small>}
    </label>
  );
}

function BottomActions({ children }: { children: ReactNode }) {
  return <div className="bottom-actions">{children}</div>;
}

async function optimiseTicketUpload(file: File) {
  const safeUploadBytes = 850 * 1024;
  if (file.size <= safeUploadBytes) return file;

  const bitmap = await createImageBitmap(file);
  const longestEdge = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 1500 / longestEdge);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const makeBlob = (quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  let compressed = await makeBlob(0.8);
  if (compressed && compressed.size > safeUploadBytes) compressed = await makeBlob(0.58);
  if (!compressed) return file;
  return new File([compressed], "ticket-upload.jpg", { type: "image/jpeg", lastModified: Date.now() });
}

function normaliseJourneyDate(value: string | null | undefined) {
  if (typeof value !== "string") return "";
  const cleaned = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function isValidJourneyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function formatJourneyDate(value: string, lang: Lang) {
  if (!isValidJourneyDate(value)) return value || "Journey date";
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function normaliseExtractedTicket(raw: ExtractedTicketPayload): TicketData {
  const text = (value: string | null | undefined) => typeof value === "string" ? value.trim() : "";
  const numeric = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? value : 0;
  const ticketType: TicketType = raw.documentType === "uts_counter_ticket" ? "uts" : "prs";
  const values = {
    ticketType,
    identifier: ticketType === "uts" ? text(raw.utsNumber) : text(raw.pnr),
    trainNumber: text(raw.trainNumber),
    trainName: text(raw.trainName),
    date: normaliseJourneyDate(raw.date),
    origin: text(raw.origin),
    destination: text(raw.destination),
    passengers: Math.max(0, Math.round(numeric(raw.passengers))),
    fare: Math.max(0, numeric(raw.fare)),
  };
  const hasValue: Record<RequiredTicketField, boolean> = {
    identifier: values.identifier.length > 0,
    trainNumber: values.trainNumber.length > 0,
    date: values.date.length > 0,
    origin: values.origin.length > 0,
    destination: values.destination.length > 0,
    fare: values.fare > 0,
  };
  const confidence = Object.fromEntries(
    (Object.keys(hasValue) as RequiredTicketField[]).map((key) => [
      key,
      hasValue[key]
        ? (key === "identifier"
          ? raw.confidence?.[ticketType === "uts" ? "utsNumber" : "pnr"] ?? "extracted"
          : raw.confidence?.[key] ?? "extracted")
        : "missing",
    ]),
  ) as Record<RequiredTicketField, ConfidenceStatus>;
  return { ...values, confidence };
}

export default function TicketWapas() {
  const [screen, setScreen] = useState<Screen>("home");
  const [lang, setLang] = useState<Lang>("en");
  const [analysis, setAnalysis] = useState<AnalysisState>("idle");
  const [captureMessage, setCaptureMessage] = useState("");
  const [ticketData, setTicketData] = useState(ticket);
  const [ticketConfirmed, setTicketConfirmed] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [surrenderStage, setSurrenderStage] = useState<SurrenderStage>("ready");
  const [surrenderConsent, setSurrenderConsent] = useState(false);
  const [possessionConfirmed, setPossessionConfirmed] = useState(false);
  const [prsRecord, setPrsRecord] = useState<PrsTicketRecord | null>(null);
  const [cancellationEvent, setCancellationEvent] = useState<CancellationEvent | null>(null);
  const [surrenderReceipt, setSurrenderReceipt] = useState<RemoteSurrenderReceipt | null>(null);
  const [existingReceiptFound, setExistingReceiptFound] = useState(false);
  const [eligibilityIssue, setEligibilityIssue] = useState<EligibilityIssue>(null);
  const [payout, setPayout] = useState<Payout>("upi");
  const [consent, setConsent] = useState(false);
  const [paid, setPaid] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [assistanceMobile, setAssistanceMobile] = useState("");
  const [assistanceCreated, setAssistanceCreated] = useState(false);
  const [assistedReason, setAssistedReason] = useState<AssistedReason>("mobile");
  const [utsReviewCreated, setUtsReviewCreated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const c = dictionary[lang];
  const tr = (english: string, hindi: string) => lang === "hi" ? hindi : english;
  const activeScreens = ticketData.ticketType === "uts" ? screens.filter((item) => item !== "otp") : screens;
  const screenIndex = screen === "assisted" ? activeScreens.indexOf("otp") : activeScreens.indexOf(screen);
  const journeyStepCount = activeScreens.length - 1;

  const effectiveConfidence = ticketData.confidence;
  const requiredTicketFields: RequiredTicketField[] = ticketData.ticketType === "uts"
    ? ["identifier", "date", "origin", "destination", "fare"]
    : ["identifier", "trainNumber", "date", "origin", "destination", "fare"];
  const confidentFieldCount = requiredTicketFields.filter((field) => effectiveConfidence[field] === "extracted").length;
  const requiredFieldCount = requiredTicketFields.length;
  const effectiveTrainNumber = ticketData.trainNumber;
  const fieldErrors: Partial<Record<RequiredTicketField, string>> = {
    ...(ticketData.ticketType === "prs" && !/^\d{10}$/.test(ticketData.identifier) ? { identifier: tr("Enter the 10-digit PNR printed on the ticket.", "टिकट पर छपा 10 अंकों का PNR भरें।") } : {}),
    ...(ticketData.ticketType === "uts" && !/^[A-Z0-9]{10}$/i.test(ticketData.identifier) ? { identifier: tr("Enter the 10-character UTS number printed on the ticket.", "टिकट पर छपा 10 अक्षरों का UTS नंबर भरें।") } : {}),
    ...(ticketData.ticketType === "prs" && !/^\d{5}$/.test(effectiveTrainNumber) ? { trainNumber: tr("Enter the 5-digit train number.", "5 अंकों का ट्रेन नंबर भरें।") } : {}),
    ...(!isValidJourneyDate(ticketData.date) ? { date: tr("Choose the journey date in DD/MM/YYYY format.", "यात्रा की तारीख DD/MM/YYYY में चुनें।") } : {}),
    ...(ticketData.origin.trim().length < 2 ? { origin: tr("Enter the boarding station name or code.", "चढ़ने वाले स्टेशन का नाम या कोड भरें।") } : {}),
    ...(ticketData.destination.trim().length < 2 ? { destination: tr("Enter the destination station name or code.", "गंतव्य स्टेशन का नाम या कोड भरें।") } : {}),
    ...(!(ticketData.fare > 0) ? { fare: tr("Enter the fare printed on the ticket.", "टिकट पर छपा किराया भरें।") } : {}),
  };
  const requiredFieldsReady =
    (ticketData.ticketType === "prs" ? /^\d{10}$/.test(ticketData.identifier) : /^[A-Z0-9]{10}$/i.test(ticketData.identifier)) &&
    (ticketData.ticketType === "uts" || /^\d{5}$/.test(effectiveTrainNumber)) &&
    isValidJourneyDate(ticketData.date) &&
    ticketData.origin.trim().length >= 2 &&
    ticketData.destination.trim().length >= 2 &&
    ticketData.fare > 0 &&
    requiredTicketFields.every((field) => effectiveConfidence[field] === "extracted");
  useEffect(() => {
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
  }, [lang]);

  function reset() {
    setScreen("home");
    setAnalysis("idle");
    setCaptureMessage("");
    setTicketData(ticket);
    setTicketConfirmed(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpVerified(false);
    setSurrenderStage("ready");
    setSurrenderConsent(false);
    setPossessionConfirmed(false);
    setPrsRecord(null);
    setCancellationEvent(null);
    setSurrenderReceipt(null);
    setExistingReceiptFound(false);
    setEligibilityIssue(null);
    setPayout("upi");
    setConsent(false);
    setPaid(false);
    setRetrying(false);
    setAssistanceMobile("");
    setAssistanceCreated(false);
    setAssistedReason("mobile");
    setUtsReviewCreated(false);
  }

  function go(next: Screen) {
    if (next === "review") setConsent(false);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function currentClaim(status: SampleClaim["status"]): SampleClaim {
    return {
      id: surrenderReceipt?.reference ?? (ticketData.ticketType === "uts" ? "TW-UTS-613" : "TW-RS-824"),
      ticket: ticketData.ticketType === "uts" ? ticketData.identifier : `PNR ${ticketData.identifier}`,
      route: `${ticketData.origin} → ${ticketData.destination}`,
      amount: ticketData.fare,
      status,
      updated: "Just now",
      destination: surrenderReceipt?.destination?.maskedLabel ?? (payout === "upi" ? "UPI · asha.rail@okaxis" : "Bank account · •••• 1842"),
    };
  }

  function startRefund() {
    if (!surrenderReceipt || !prsRecord) return;
    const destination: RefundDestination = prsRecord.originalPayment.kind === "pos"
      ? { kind: "original", maskedLabel: prsRecord.originalPayment.maskedDestination, beneficiaryName: prsRecord.claimantName, nameMatched: true }
      : payout === "upi"
        ? { kind: "upi", maskedLabel: "UPI · asha.rail@okaxis", beneficiaryName: "Asha P.", nameMatched: true }
        : { kind: "bank", maskedLabel: "Bank account · •••• 1842", beneficiaryName: "Asha P.", nameMatched: true };
    const instruction = createRefundInstruction(surrenderReceipt, destination);
    setSurrenderReceipt(instruction.receipt);
    const processingClaim = currentClaim("processing");
    processingClaim.destination = destination.maskedLabel;
    setPaid(false);
    setRetrying(true);
    writeSampleClaim(processingClaim);
    go("tracking");
    window.setTimeout(() => {
      const paidReceipt = markRefundPaid(instruction.receipt);
      setSurrenderReceipt(paidReceipt);
      setPaid(true);
      setRetrying(false);
      writeSampleClaim({ ...processingClaim, status: "paid", updated: "Just now" });
    }, 900);
  }

  function checkCancellation() {
    setEligibilityIssue(null);
    setExistingReceiptFound(false);
    setPrsRecord(null);
    setCancellationEvent(null);
    setSurrenderReceipt(null);
    if (ticketData.ticketType === "uts") {
      go("eligibility");
      return;
    }
    const record = getPrsTicketRecord(ticketData.identifier, ticketData.trainNumber, ticketData.date);
    if (!record) {
      setEligibilityIssue("record_not_found");
      go("eligibility");
      return;
    }
    const normalise = (value: string) => value.trim().toLocaleLowerCase("en-IN").replace(/\s+/g, " ");
    const confirmedDetailsMatch =
      normalise(ticketData.origin) === normalise(record.origin) &&
      normalise(ticketData.destination) === normalise(record.destination) &&
      Number(ticketData.fare) === record.refundAmount;
    if (!confirmedDetailsMatch) {
      setEligibilityIssue("record_not_found");
      go("eligibility");
      return;
    }
    const event = getFinalCancellationEvent(record);
    setPrsRecord(record);
    setCancellationEvent(event);
    if (event.status !== "final_cancelled") {
      setEligibilityIssue("not_final");
      go("eligibility");
      return;
    }
    const existing = getExistingRemoteSurrender(record, event);
    if (existing) {
      setSurrenderReceipt(existing);
      setExistingReceiptFound(true);
    }
    go("eligibility");
  }

  function verifyOtp() {
    if (!prsRecord) return;
    const result = verifyBookingMobile(prsRecord, otp.join(""));
    if (!result.ok) {
      if (result.reason === "no_booking_mobile") {
        setAssistedReason("mobile");
        go("assisted");
        return;
      }
      setOtpError(tr("That code is incorrect. Use the demo code shown below.", "यह कोड सही नहीं है। नीचे दिया डेमो कोड इस्तेमाल करें।"));
      return;
    }
    setOtpError("");
    setOtpVerified(true);
    go("surrender");
  }

  function saveRemoteSurrender() {
    if (!prsRecord || !cancellationEvent) return;
    const result = recordRemoteSurrender({
      record: prsRecord,
      cancellationEvent,
      otpVerified,
      possessionConfirmed,
      consentGiven: surrenderConsent,
    });
    setSurrenderReceipt(result.receipt);
    setExistingReceiptFound(result.reused);
    setSurrenderStage("recorded");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openExistingReceipt() {
    if (!surrenderReceipt) return;
    setPaid(surrenderReceipt.status === "paid");
    setRetrying(surrenderReceipt.status === "refund_instructed");
    go(surrenderReceipt.destination ? "tracking" : "payout");
  }

  function back() {
    if (screen === "assisted") {
      go(assistedReason === "beneficiary" ? "payout" : assistedReason === "mobile" ? "otp" : "eligibility");
      return;
    }
    const index = Math.max(0, screenIndex - 1);
    go(activeScreens[index]);
  }

  function runSample(ticketType: TicketType) {
    setAnalysis("reading");
    setCaptureMessage("");
    setTicketConfirmed(false);
    setUtsReviewCreated(false);
    setPrsRecord(null);
    setCancellationEvent(null);
    setSurrenderReceipt(null);
    setExistingReceiptFound(false);
    setEligibilityIssue(null);
    setOtpVerified(false);
    setOtpError("");
    setSurrenderStage("ready");
    setSurrenderConsent(false);
    setPossessionConfirmed(false);
    setTicketData(ticketType === "uts" ? utsTicket : ticket);
    window.setTimeout(() => {
      setAnalysis("done");
      go("details");
    }, 850);
  }

  function startManualEntry() {
    setTicketData(emptyTicket("prs"));
    setTicketConfirmed(false);
    setCaptureMessage("");
    setUtsReviewCreated(false);
    setPrsRecord(null);
    setCancellationEvent(null);
    setSurrenderReceipt(null);
    setExistingReceiptFound(false);
    setEligibilityIssue(null);
    go("details");
  }

  function selectTicketType(ticketType: TicketType) {
    if (ticketData.ticketType === ticketType) return;
    setTicketData(emptyTicket(ticketType));
    setTicketConfirmed(false);
    setUtsReviewCreated(false);
    setPrsRecord(null);
    setCancellationEvent(null);
    setSurrenderReceipt(null);
    setExistingReceiptFound(false);
    setEligibilityIssue(null);
  }

  function updateTicketField(field: RequiredTicketField, value: string) {
    const cleaned = field === "identifier"
      ? (ticketData.ticketType === "prs" ? value.replace(/\D/g, "") : value.replace(/[^A-Z0-9]/gi, "").toUpperCase()).slice(0, 10)
      : field === "trainNumber"
        ? value.replace(/\D/g, "").slice(0, 5)
        : value.trimStart();
    const numericFare = field === "fare" ? Number(cleaned.replace(/[^0-9.]/g, "")) : 0;
    const isValid = field === "identifier"
      ? (ticketData.ticketType === "prs" ? /^\d{10}$/.test(cleaned) : /^[A-Z0-9]{10}$/.test(cleaned))
      : field === "trainNumber"
        ? /^\d{5}$/.test(cleaned)
        : field === "date"
          ? isValidJourneyDate(cleaned)
          : field === "fare"
          ? Number.isFinite(numericFare) && numericFare > 0
          : cleaned.trim().length >= 2;
    setTicketConfirmed(false);
    setTicketData((current) => ({
      ...current,
      [field]: field === "fare" ? (Number.isFinite(numericFare) ? numericFare : 0) : cleaned,
      confidence: { ...current.confidence, [field]: isValid ? "extracted" : "missing" },
    }));
  }

  function updateOptionalTicketField(field: "trainName" | "passengers", value: string) {
    setTicketConfirmed(false);
    setTicketData((current) => ({
      ...current,
      [field]: field === "passengers" ? Math.max(0, Math.min(12, Number(value.replace(/\D/g, "")) || 0)) : value.trimStart(),
    }));
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setCaptureMessage("");
    setTicketConfirmed(false);
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setAnalysis("fallback");
      setCaptureMessage(tr("Choose a JPG, PNG or WEBP image of a synthetic physical counter ticket.", "नकली भौतिक काउंटर टिकट की JPG, PNG या WEBP तस्वीर चुनें।"));
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setAnalysis("fallback");
      setCaptureMessage(tr("The image must be smaller than 5 MB. Try a lower-resolution photo.", "तस्वीर 5 MB से छोटी होनी चाहिए। कम आकार की तस्वीर आज़माएँ।"));
      return;
    }
    setAnalysis("reading");
    try {
      const form = new FormData();
      form.set("ticket", await optimiseTicketUpload(file));
      const response = await fetch("/api/extract-ticket", { method: "POST", body: form });
      const data = (await response.json().catch(() => ({}))) as { code?: string; message?: string; ticket?: ExtractedTicketPayload };
      if (!response.ok) {
        const rejected = response.status === 422 || data.code === "NOT_COUNTER_TICKET" || data.code === "TICKET_UNCLEAR";
        setAnalysis(rejected ? "rejected" : "fallback");
        setCaptureMessage(data.message ?? (rejected
          ? tr("This does not look like a readable physical counter ticket.", "यह पढ़ने योग्य भौतिक काउंटर टिकट नहीं लगती।")
          : tr("The ticket reader is temporarily unavailable. Try again or enter the details manually.", "टिकट रीडर अभी उपलब्ध नहीं है। फिर कोशिश करें या जानकारी खुद भरें।")));
        return;
      }
      if (!new Set(["prs_counter_ticket", "uts_counter_ticket"]).has(data.ticket?.documentType ?? "")) {
        setAnalysis("rejected");
        setCaptureMessage(tr("This image does not look like a physical railway counter ticket. Upload a clear synthetic counter-ticket image.", "यह तस्वीर भौतिक रेलवे काउंटर टिकट नहीं लगती। साफ़ नकली काउंटर टिकट की तस्वीर अपलोड करें।"));
        return;
      }
      setTicketData(normaliseExtractedTicket(data.ticket));
      setAnalysis("done");
      window.setTimeout(() => go("details"), 500);
    } catch {
      setAnalysis("fallback");
      setCaptureMessage(tr("We could not reach the ticket reader. Check your connection, try again or enter the details manually.", "टिकट रीडर से संपर्क नहीं हो सका। इंटरनेट जाँचें, फिर कोशिश करें या जानकारी खुद भरें।"));
    }
  }

  return (
    <main className="site-shell">
      <div className="service-strip">
        <span>CITIZEN REFUND SERVICE · नागरिक रिफंड सेवा</span>
        <b>{tr("Reserved PRS counter-ticket refunds", "आरक्षित PRS काउंटर टिकट रिफंड")}</b>
      </div>
      <header className="topbar">
        <button className="brand-button" onClick={() => reset()} aria-label="Ticket Wapas home">
          <BrandMark />
          <span className="brand-copy"><b>TICKET WAPAS</b><small>टिकट वापस · CITIZEN REFUND SERVICE</small></span>
        </button>
        <div className="header-actions">
          <a className="account-link" href="/status">{tr("Sign in", "साइन इन")}</a>
          <div className="language-toggle" role="group" aria-label="Choose language">
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हिं</button>
          </div>
        </div>
      </header>

      <div className="workspace">
        <section className="app-frame" aria-live="polite">
          {screen !== "home" && (
            <div className="progress-wrap">
              <button className="back-button" onClick={back}><Icon name="back" size={18} />{c.back}</button>
              <div className="progress-info"><span>{tr(`STEP ${screenIndex} OF ${journeyStepCount}`, `चरण ${screenIndex} / ${journeyStepCount}`)}</span><b>{Math.round((screenIndex / journeyStepCount) * 100)}%</b></div>
              <div className="progress-track"><span style={{ width: `${(screenIndex / journeyStepCount) * 100}%` }} /></div>
            </div>
          )}

          {screen === "home" && (
            <div className="screen home-screen">
              <div className="service-intro">
                <span><Icon name="shield" size={22} /></span>
                <p><b>{tr("Reserved PRS counter-ticket refund", "आरक्षित PRS काउंटर टिकट रिफंड")}</b><small>{tr("For a train cancelled by Railways", "रेलवे द्वारा रद्द ट्रेन के लिए")}</small></p>
              </div>
              <h1>{tr("Train cancelled? Get your counter-ticket refund without returning to the station.", "ट्रेन रद्द हुई? स्टेशन लौटे बिना काउंटर टिकट का रिफंड पाएँ।")}</h1>
              <p className="hero-sub">{tr("A proposed remote journey for reserved paper tickets with a PNR. Check the ticket, prove it is yours and receive a trackable refund receipt.", "PNR वाली आरक्षित कागज़ी टिकटों के लिए प्रस्तावित ऑनलाइन प्रक्रिया। टिकट जाँचें, मालिकाना साबित करें और रिफंड रसीद पाएँ।")}</p>
              <div className="home-actions">
                <button className="primary-button" onClick={() => go("capture")}><Icon name="camera" />{tr("Take or upload ticket photo", "टिकट की तस्वीर लें या अपलोड करें")}</button>
                <button className="secondary-button" onClick={startManualEntry}>{tr("Enter ticket details", "टिकट की जानकारी भरें")}<Icon name="arrow" /></button>
              </div>
              <div className="home-requirements" aria-label={tr("What you need", "क्या चाहिए")}>
                <span><Icon name="ticket" size={18} /><p><b>{tr("Original PRS paper ticket", "मूल PRS कागज़ी टिकट")}</b><small>{tr("A 10-digit PNR is printed on it", "इस पर 10 अंकों का PNR होता है")}</small></p></span>
                <span><Icon name="phone" size={18} /><p><b>{tr("Booking mobile", "बुकिंग मोबाइल")}</b><small>{tr("Retrieved from the ticket record", "टिकट रिकॉर्ड से प्राप्त")}</small></p></span>
              </div>
              <p className="home-help">{tr("No login required · Usually takes about 2 minutes", "लॉगिन की ज़रूरत नहीं · आमतौर पर लगभग 2 मिनट")} · <a href="/service-information">{tr("Service information", "सेवा की जानकारी")}</a></p>
            </div>
          )}

          {screen === "capture" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("ADD YOUR PRS TICKET", "अपनी PRS टिकट जोड़ें")}</p><h1>{tr("Take a clear photo of the paper ticket.", "कागज़ी टिकट की साफ़ तस्वीर लें।")}</h1><p>{tr("The reader only fills visible ticket details. You check every field before the refund journey continues. For this prototype, use synthetic data only.", "रीडर केवल टिकट पर दिखाई देने वाली जानकारी भरता है। आगे बढ़ने से पहले आप हर जानकारी जाँचते हैं। इस प्रोटोटाइप में केवल नकली डेटा इस्तेमाल करें।")}</p></div>
              <input ref={fileRef} className="file-input-hidden" tabIndex={-1} aria-hidden="true" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
              <button className="upload-zone" onClick={() => fileRef.current?.click()} disabled={analysis === "reading"} aria-busy={analysis === "reading"}>
                <span className="upload-icon"><Icon name={analysis === "reading" ? "sparkle" : "camera"} size={28} /></span>
                <strong>{analysis === "reading" ? tr("Reading ticket…", "टिकट पढ़ी जा रही है…") : tr("Take or upload ticket photo", "टिकट की तस्वीर लें या अपलोड करें")}</strong>
                <small>{tr("JPG, PNG or WEBP · up to 5 MB · compressed on your device", "JPG, PNG या WEBP · अधिकतम 5 MB · आपके फ़ोन पर आकार कम होगा")}</small>
                {analysis === "reading" && <span className="scan-line" />}
              </button>
              <button className="secondary-button capture-manual" onClick={startManualEntry}>{tr("Enter ticket details", "टिकट की जानकारी भरें")}<Icon name="arrow" size={17} /></button>
              {(analysis === "fallback" || analysis === "rejected") && (
                <div className={`capture-error ${analysis}`} role="alert">
                  <span><Icon name={analysis === "rejected" ? "alert" : "info"} size={24} /></span>
                  <div><b>{analysis === "rejected" ? tr("This does not look like a counter ticket.", "यह काउंटर टिकट नहीं लगती।") : tr("We could not read the ticket.", "टिकट पढ़ी नहीं जा सकी।")}</b><p>{captureMessage}</p></div>
                  <button onClick={() => fileRef.current?.click()}>{tr("Try another image", "दूसरी तस्वीर आज़माएँ")}</button>
                  <button onClick={startManualEntry}>{tr("Enter details manually", "जानकारी खुद भरें")}</button>
                </div>
              )}
              <div className="or-divider"><span>{tr("or try a sample ticket", "या नमूना टिकट आज़माएँ")}</span></div>
              <div className="sample-options">
                <button onClick={() => runSample("prs")} disabled={analysis === "reading"}><span className="sample-ticket-icon"><Icon name="file" size={22} /></span><p><small>{tr("RESERVED · SYNTHETIC", "आरक्षित · नकली")}</small><b>Rajdhani · NDLS → DBRT</b><em>PNR 2468135790</em></p><Icon name="arrow" size={17} /></button>
              </div>
              <button className="uts-help-link" onClick={() => runSample("uts")} disabled={analysis === "reading"}>{tr("Have a General / UTS ticket? Check its separate route", "जनरल / UTS टिकट है? उसकी अलग प्रक्रिया देखें")}<Icon name="arrow" size={16} /></button>
            </div>
          )}

          {screen === "details" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("CHECK AND CORRECT", "जाँचें और सुधारें")}</p><h1>{confidentFieldCount === 0 ? tr("Enter your ticket details.", "टिकट की जानकारी भरें।") : tr("Check every detail before continuing.", "आगे बढ़ने से पहले हर जानकारी जाँचें।")}</h1><p>{tr("The ticket reader can make mistakes. Compare these values with the printed ticket and edit anything that is wrong.", "टिकट रीडर से गलती हो सकती है। छपी टिकट से जानकारी मिलाएँ और जो गलत हो उसे सुधारें।")}</p></div>
              <div className="ticket-type-tabs" role="tablist" aria-label={tr("Paper ticket type", "कागज़ी टिकट का प्रकार")}><button role="tab" aria-selected={ticketData.ticketType === "prs"} className={ticketData.ticketType === "prs" ? "active" : ""} onClick={() => selectTicketType("prs")}><b>{tr("Reserved ticket", "आरक्षित टिकट")}</b><small>{tr("Has a PNR", "PNR होता है")}</small></button><button role="tab" aria-selected={ticketData.ticketType === "uts"} className={ticketData.ticketType === "uts" ? "active" : ""} onClick={() => selectTicketType("uts")}><b>{tr("General / UTS", "जनरल / UTS")}</b><small>{tr("No PNR", "PNR नहीं होता")}</small></button></div>
              {ticketData.ticketType === "uts" && <div className="ticket-type-notice"><Icon name="info" size={18} /><p><b>{tr("Unreserved UTS ticket found", "अनारक्षित UTS टिकट मिली")}</b><span>{tr("This ticket has a UTS number instead of a PNR. A booking mobile is not expected.", "इस टिकट पर PNR की जगह UTS नंबर होता है। बुकिंग मोबाइल की उम्मीद नहीं की जाती।")}</span></p></div>}
              <div className="reader-summary"><span className="reader-icon"><Icon name="sparkle" /></span><div><b>{confidentFieldCount === requiredFieldCount ? tr(`All ${requiredFieldCount} required details were found`, `सभी ${requiredFieldCount} ज़रूरी जानकारियाँ मिल गईं`) : tr(`${confidentFieldCount} of ${requiredFieldCount} required details were found`, `${requiredFieldCount} में से ${confidentFieldCount} ज़रूरी जानकारियाँ मिलीं`)}</b><p>{tr("Every field is editable, and you stay in control.", "हर जानकारी बदली जा सकती है और नियंत्रण आपके पास है।")}</p></div></div>
              <div className="field-grid">
                <Field lang={lang} label={ticketData.ticketType === "uts" ? tr("UTS NUMBER", "UTS नंबर") : "PNR"} value={ticketData.identifier} status={effectiveConfidence.identifier} inputMode={ticketData.ticketType === "prs" ? "numeric" : "text"} maxLength={10} placeholder={ticketData.ticketType === "uts" ? tr("10-character UTS number", "10 अक्षरों का UTS नंबर") : tr("10-digit PNR", "10 अंकों का PNR")} error={fieldErrors.identifier} onChange={(value) => updateTicketField("identifier", value)} />
                <Field lang={lang} label={ticketData.ticketType === "uts" ? tr("TRAIN NUMBER (IF PRINTED)", "ट्रेन नंबर (अगर छपा हो)") : tr("TRAIN NUMBER", "ट्रेन नंबर")} value={effectiveTrainNumber} status={effectiveConfidence.trainNumber} optional={ticketData.ticketType === "uts"} inputMode="numeric" maxLength={5} placeholder={ticketData.ticketType === "uts" ? tr("Optional for most UTS tickets", "अधिकतर UTS टिकटों में वैकल्पिक") : tr("5-digit train number", "5 अंकों का ट्रेन नंबर")} error={fieldErrors.trainNumber} hint={ticketData.ticketType === "uts" ? tr("Optional unless issued for one train", "किसी खास ट्रेन के लिए हो तभी ज़रूरी") : undefined} onChange={(value) => updateTicketField("trainNumber", value)} />
                <Field lang={lang} label={tr("JOURNEY DATE", "यात्रा की तारीख")} value={ticketData.date} status={effectiveConfidence.date} type="date" error={fieldErrors.date} hint="DD/MM/YYYY" onChange={(value) => updateTicketField("date", value)} />
                <Field lang={lang} label={tr("FROM STATION", "किस स्टेशन से")} value={ticketData.origin} status={effectiveConfidence.origin} placeholder={tr("e.g. New Delhi or NDLS", "जैसे नई दिल्ली या NDLS")} error={fieldErrors.origin} onChange={(value) => updateTicketField("origin", value)} />
                <Field lang={lang} label={tr("TO STATION", "किस स्टेशन तक")} value={ticketData.destination} status={effectiveConfidence.destination} placeholder={tr("e.g. Dibrugarh or DBRT", "जैसे डिब्रूगढ़ या DBRT")} error={fieldErrors.destination} onChange={(value) => updateTicketField("destination", value)} />
                <Field lang={lang} label={tr("TICKET FARE (₹)", "टिकट का किराया (₹)")} value={ticketData.fare > 0 ? String(ticketData.fare) : ""} status={effectiveConfidence.fare} type="number" inputMode="decimal" placeholder={tr("Fare paid", "दिया गया किराया")} error={fieldErrors.fare} onChange={(value) => updateTicketField("fare", value)} />
                <Field lang={lang} label={tr("TRAIN NAME", "ट्रेन का नाम")} value={ticketData.trainName} status={ticketData.trainName ? "extracted" : "missing"} optional placeholder={tr("As printed on ticket", "जैसा टिकट पर छपा है")} hint={tr("Optional", "वैकल्पिक")} onChange={(value) => updateOptionalTicketField("trainName", value)} />
                <Field lang={lang} label={tr("PASSENGERS", "यात्री")} value={ticketData.passengers > 0 ? String(ticketData.passengers) : ""} status={ticketData.passengers > 0 ? "extracted" : "missing"} optional type="number" inputMode="numeric" placeholder={tr("Number of passengers", "यात्रियों की संख्या")} hint={tr("Optional", "वैकल्पिक")} onChange={(value) => updateOptionalTicketField("passengers", value)} />
              </div>
              {!requiredFieldsReady && <div className="inline-notice"><Icon name="alert" /><p><b>{tr("Complete the marked fields to continue.", "आगे बढ़ने के लिए चिन्हित जानकारी पूरी करें।")}</b>{ticketData.ticketType === "uts" ? tr("Use the exact UTS number, journey date and route printed on the ticket.", "टिकट पर छपे सही UTS नंबर, यात्रा की तारीख और मार्ग भरें।") : tr("Use the exact PNR, five-digit train number and journey details printed on the ticket.", "टिकट पर छपे सही PNR, पाँच अंकों के ट्रेन नंबर और यात्रा की जानकारी भरें।")}</p></div>}
              <label className="confirmation-check"><input type="checkbox" checked={ticketConfirmed} disabled={!requiredFieldsReady} onChange={(event) => setTicketConfirmed(event.target.checked)} /><span><b>{ticketData.ticketType === "uts" ? tr("I checked the UTS number, journey date and route.", "मैंने UTS नंबर, यात्रा की तारीख और मार्ग जाँच लिया है।") : tr("I checked the PNR, train number and journey date.", "मैंने PNR, ट्रेन नंबर और यात्रा की तारीख जाँच ली है।")}</b><small>{requiredFieldsReady ? tr("These details match the printed ticket.", "ये जानकारियाँ छपी टिकट से मेल खाती हैं।") : tr("Complete the marked fields first.", "पहले चिन्हित जानकारी पूरी करें।")}</small></span></label>
              <div className="privacy-note"><Icon name="lock" size={18} /><span><b>{tr("Your ticket image is not stored.", "आपकी टिकट की तस्वीर सहेजी नहीं जाती।")}</b> {tr("The reader only extracts visible fields. Fixed service rules—not AI—decide whether the journey can continue.", "रीडर केवल दिखाई देने वाली जानकारी निकालता है। तय सेवा नियम—AI नहीं—निर्णय लेते हैं कि प्रक्रिया आगे बढ़ सकती है या नहीं।")}</span></div>
              <BottomActions><button className="primary-button" onClick={checkCancellation} disabled={!requiredFieldsReady || !ticketConfirmed}>{tr("Confirm & check cancellation", "पुष्टि करें और रद्द होने की जाँच करें")}<Icon name="arrow" /></button><button className="text-button" onClick={() => go("capture")}>{tr("Use a different ticket image", "दूसरी टिकट की तस्वीर इस्तेमाल करें")}</button></BottomActions>
            </div>
          )}

          {screen === "eligibility" && (
            <div className="screen">
              {ticketData.ticketType === "uts" ? (
                !utsReviewCreated ? (
                  <>
                    <div className="screen-heading"><p className="eyebrow">{tr("SEPARATE UTS ROUTE", "अलग UTS प्रक्रिया")}</p><h1>{tr("A General / UTS ticket needs a different check.", "जनरल / UTS टिकट के लिए अलग जाँच चाहिए।")}</h1><p>{tr("UTS tickets can cover a route or time window and may not be linked to one reserved train. We do not apply the PRS refund promise to them.", "UTS टिकट किसी मार्ग या समय अवधि के लिए हो सकती हैं और एक आरक्षित ट्रेन से जुड़ी नहीं होतीं। हम उन पर PRS रिफंड का वादा लागू नहीं करते।")}</p></div>
                    <div className="decision-card operating"><span className="decision-icon"><Icon name="info" size={28} /></span><div><small>{tr("AUTHORISED UTS CHECK REQUIRED", "अधिकृत UTS जाँच ज़रूरी")}</small><strong>{tr("Refund not started", "रिफंड शुरू नहीं हुआ")}</strong><p>{tr("The service will not invent a train link or promise the wrong refund.", "सेवा ट्रेन का गलत संबंध नहीं बनाएगी या गलत रिफंड का वादा नहीं करेगी।")}</p></div></div>
                    <div className="rule-list"><div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("UTS number and route saved", "UTS नंबर और मार्ग सुरक्षित")}</b><small>{ticketData.identifier}</small></p></div><div><span className="rule-bad"><Icon name="route" size={15} /></span><p><b>{tr("Zone and alternate-service rules still need checking", "ज़ोन और वैकल्पिक सेवा नियमों की जाँच बाकी")}</b><small>{tr("An authorised UTS service must make this decision", "यह निर्णय अधिकृत UTS सेवा को लेना होगा")}</small></p></div></div>
                    <BottomActions><button className="primary-button" onClick={() => { setUtsReviewCreated(true); window.scrollTo({ top: 0, behavior: "auto" }); }}>{tr("Create UTS verification request", "UTS जाँच अनुरोध बनाएँ")}<Icon name="arrow" /></button><button className="secondary-button" onClick={() => go("details")}>{tr("Edit ticket details", "टिकट की जानकारी बदलें")}</button></BottomActions>
                  </>
                ) : (
                  <div className="assist-success"><div className="success-orbit paid"><span><Icon name="check" size={34} /></span></div><p className="eyebrow">{tr("UTS REFERENCE TW-UTS-HELP-219", "UTS संदर्भ TW-UTS-HELP-219")}</p><h1>{tr("Verification request created.", "जाँच अनुरोध बन गया।")}</h1><p className="hero-sub">{tr("An authorised service would check the applicable UTS and zone rules before deciding whether any refund is available.", "अधिकृत सेवा रिफंड तय करने से पहले लागू UTS और ज़ोन नियम जाँचेगी।")}</p><div className="plain-language"><b>{tr("No refund was started", "रिफंड शुरू नहीं हुआ")}</b><p>{tr("Keep this reference so you do not have to enter the ticket details again.", "यह संदर्भ सुरक्षित रखें ताकि टिकट की जानकारी दोबारा न भरनी पड़े।")}</p></div><BottomActions><button className="primary-button" onClick={reset}>{tr("Return to home", "मुख्य पृष्ठ पर जाएँ")}<Icon name="arrow" /></button></BottomActions></div>
                )
              ) : eligibilityIssue ? (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("PRS RECORD CHECK", "PRS रिकॉर्ड जाँच")}</p><h1>{eligibilityIssue === "record_not_found" ? tr("We could not match this synthetic ticket.", "इस नकली टिकट का रिकॉर्ड नहीं मिला।") : tr("The cancellation is not final yet.", "रद्दीकरण अभी अंतिम नहीं है।")}</h1><p>{eligibilityIssue === "record_not_found" ? tr("Check the PNR, train number and journey date. Only the sample records are connected in this independent prototype.", "PNR, ट्रेन नंबर और यात्रा तारीख जाँचें। इस स्वतंत्र प्रोटोटाइप में केवल नमूना रिकॉर्ड जुड़े हैं।") : tr("A restored or still-changing service cannot start a refund. Check again after the authorised status becomes final.", "बहाल या बदल रही सेवा का रिफंड शुरू नहीं हो सकता। अधिकृत स्थिति अंतिम होने के बाद फिर जाँचें।")}</p></div>
                  <div className="decision-card operating"><span className="decision-icon"><Icon name="info" size={28} /></span><div><small>{tr("NO REFUND STARTED", "रिफंड शुरू नहीं हुआ")}</small><strong>{tr("Your ticket remains unchanged", "आपकी टिकट में कोई बदलाव नहीं")}</strong><p>{tr("No surrender or payment instruction was created.", "कोई समर्पण या भुगतान निर्देश नहीं बना।")}</p></div></div>
                  <BottomActions><button className="primary-button" onClick={() => go("details")}>{tr("Check ticket details", "टिकट की जानकारी जाँचें")}<Icon name="arrow" /></button><button className="secondary-button" onClick={() => { setAssistedReason("record"); go("assisted"); }}>{tr("Request help", "सहायता माँगें")}</button></BottomActions>
                </>
              ) : existingReceiptFound && surrenderReceipt ? (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("EXISTING REQUEST FOUND", "पुराना अनुरोध मिला")}</p><h1>{tr("This ticket already has a refund request.", "इस टिकट का रिफंड अनुरोध पहले से है।")}</h1><p>{tr("We opened the existing record instead of creating a second surrender or refund.", "दूसरा समर्पण या रिफंड बनाने के बजाय पुराना रिकॉर्ड खोला गया है।")}</p></div>
                  <div className="decision-card eligible"><span className="decision-icon"><Icon name="shield" size={29} /></span><div><small>{tr("NO DUPLICATE CREATED", "दूसरा अनुरोध नहीं बना")}</small><strong>{surrenderReceipt.reference}</strong><p>{surrenderReceipt.status === "paid" ? tr("Refund paid", "रिफंड भुगतान हुआ") : surrenderReceipt.destination ? tr("Refund in progress", "रिफंड जारी है") : tr("Remote surrender recorded", "ऑनलाइन समर्पण दर्ज")}</p></div></div>
                  <div className="receipt-facts"><p><span>{tr("PNR", "PNR")}</span><b>{surrenderReceipt.pnrMasked}</b></p><p><span>{tr("Amount", "राशि")}</span><b>₹{surrenderReceipt.amount.toLocaleString("en-IN")}</b></p><p><span>{tr("Recorded", "दर्ज हुआ")}</span><b>{surrenderReceipt.surrenderRecordedAt}</b></p></div>
                  <BottomActions><button className="primary-button" onClick={openExistingReceipt}>{tr("Open existing receipt", "पुरानी रसीद खोलें")}<Icon name="arrow" /></button><button className="secondary-button" onClick={() => go("capture")}>{tr("Use a different ticket", "दूसरी टिकट इस्तेमाल करें")}</button></BottomActions>
                </>
              ) : prsRecord && cancellationEvent ? (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("FINAL CANCELLATION CHECK", "अंतिम रद्दीकरण जाँच")}</p><h1>{tr("This PRS ticket can continue.", "यह PRS टिकट आगे बढ़ सकती है।")}</h1><p>{tr("The synthetic PRS record and final train-cancellation event match the details you confirmed.", "नकली PRS रिकॉर्ड और अंतिम ट्रेन रद्दीकरण जानकारी आपकी पुष्टि की गई जानकारी से मेल खाते हैं।")}</p></div>
                  <div className="decision-card eligible"><span className="decision-icon"><Icon name="check" size={30} /></span><div><small>{tr("FINAL CANCELLATION CONFIRMED · SIMULATED", "अंतिम रद्दीकरण पुष्ट · नकली")}</small><strong>₹{prsRecord.refundAmount.toLocaleString("en-IN")} {tr("refund available", "रिफंड उपलब्ध")}</strong><p>{tr("Reserved PRS ticket · 1 passenger · no cancellation charge", "आरक्षित PRS टिकट · 1 यात्री · कोई रद्दीकरण शुल्क नहीं")}</p></div></div>
                  <div className="rule-list"><div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("PRS ticket record matched", "PRS टिकट रिकॉर्ड मिला")}</b><small>PNR {ticketData.identifier}</small></p></div><div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("Cancellation is final", "रद्दीकरण अंतिम है")}</b><small>{cancellationEvent.decidedAt}</small></p></div><div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("No earlier refund found", "पहले का कोई रिफंड नहीं मिला")}</b><small>{tr("This ticket can continue", "यह टिकट आगे बढ़ सकती है")}</small></p></div></div>
                  {!prsRecord.linkedMobileMasked ? <div className="inline-notice"><Icon name="alert" /><p><b>{tr("No booking mobile is available", "बुकिंग मोबाइल उपलब्ध नहीं है")}</b>{tr("Ownership needs an assisted review before the ticket can be surrendered.", "टिकट समर्पित करने से पहले मालिकाना की सहायता से जाँच ज़रूरी है।")}</p></div> : prsRecord.originalPayment.kind === "cash" && prsRecord.passengerCount > 1 ? <div className="inline-notice"><Icon name="alert" /><p><b>{tr("A refund recipient must be confirmed", "रिफंड पाने वाले की पुष्टि ज़रूरी है")}</b>{tr("This cash-paid ticket has more than one passenger, so the service will not choose a recipient automatically.", "इस नकद टिकट पर एक से अधिक यात्री हैं, इसलिए सेवा अपने-आप रिफंड पाने वाला नहीं चुनेगी।")}</p></div> : <div className="record-source"><Icon name="phone" size={19} /><p><b>{tr("Booking mobile found in the PRS record", "PRS रिकॉर्ड में बुकिंग मोबाइल मिला")}</b><span>{prsRecord.linkedMobileMasked} · {tr("It was not read from the ticket photo", "यह टिकट की तस्वीर से नहीं पढ़ा गया")}</span></p></div>}
                  <BottomActions>{!prsRecord.linkedMobileMasked ? <button className="primary-button" onClick={() => { setAssistedReason("mobile"); go("assisted"); }}>{tr("Continue with assisted review", "सहायता से जाँच जारी रखें")}<Icon name="arrow" /></button> : prsRecord.originalPayment.kind === "cash" && prsRecord.passengerCount > 1 ? <button className="primary-button" onClick={() => { setAssistedReason("multi_passenger"); go("assisted"); }}>{tr("Confirm the refund recipient", "रिफंड पाने वाले की पुष्टि करें")}<Icon name="arrow" /></button> : <button className="primary-button" onClick={() => go("otp")}>{tr("Verify booking mobile", "बुकिंग मोबाइल सत्यापित करें")}<Icon name="arrow" /></button>}</BottomActions>
                </>
              ) : null}
            </div>
          )}

          {screen === "otp" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("PROVE OWNERSHIP", "मालिकाना साबित करें")}</p><h1>{tr("Check the booking mobile.", "बुकिंग वाला फ़ोन जाँचें।")}</h1><p>{tr("The simulated PRS record—not the ticket photo—returned", "टिकट की तस्वीर नहीं, नकली PRS रिकॉर्ड से मिला नंबर है")} <b>{prsRecord?.linkedMobileMasked ?? "+91 •••••• 2714"}</b>{tr(". A 6-digit code was sent there.", "। इसी पर 6 अंकों का कोड भेजा गया है।")}</p></div>
              <div className="otp-row" aria-label="One-time password">
                {otp.map((digit, index) => <input key={index} inputMode="numeric" maxLength={1} value={digit} aria-label={tr(`OTP digit ${index + 1}`, `OTP अंक ${index + 1}`)} aria-invalid={Boolean(otpError)} onChange={(event) => { const copy = [...otp]; copy[index] = event.target.value.replace(/\D/g, ""); setOtp(copy); setOtpError(""); }} />)}
              </div>
              {otpError && <div className="otp-error" role="alert"><Icon name="alert" size={18} />{otpError}</div>}
              <div className="demo-code"><span><Icon name="sparkle" size={16} /> {tr("DEMO CODE", "डेमो कोड")}</span><b>271406</b><button onClick={() => setOtp(["2", "7", "1", "4", "0", "6"])}>{tr("Fill code", "कोड भरें")}</button></div>
              <p className="attempt-note"><Icon name="shield" size={16} /> {tr("3 attempts maximum · code expires in 10 minutes", "अधिकतम 3 कोशिशें · कोड 10 मिनट में समाप्त होगा")}</p>
              <button className="phone-help" onClick={() => { setAssistedReason("mobile"); go("assisted"); }}><Icon name="phone" size={19} /><span><b>{tr("I no longer have access to this number", "अब यह नंबर मेरे पास नहीं है")}</b><small>{tr("Get an assisted verification reference", "सहायता से सत्यापन का संदर्भ पाएँ")}</small></span><Icon name="arrow" size={18} /></button>
              <BottomActions><button className="primary-button" disabled={otp.join("").length !== 6} onClick={verifyOtp}>{tr("Verify code", "कोड सत्यापित करें")}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "surrender" && (
            <div className="screen">
              {surrenderStage === "ready" && (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("PRESENT TICKET CHECK", "मौजूदा टिकट जाँच")}</p><h1>{tr("Show that the original ticket is still with you.", "दिखाएँ कि मूल टिकट अभी आपके पास है।")}</h1><p>{tr("A fresh photo supports present possession. It does not by itself surrender or invalidate the paper ticket.", "नई तस्वीर मौजूदा कब्ज़ा दिखाने में मदद करती है। केवल तस्वीर कागज़ी टिकट को समर्पित या अमान्य नहीं करती।")}</p></div>
                  <div className="surrender-challenge">
                    <div className="challenge-heading"><span><Icon name="camera" /></span><p><b>{tr("Take a one-time possession photo", "एक बार इस्तेमाल होने वाली कब्ज़े की तस्वीर लें")}</b><small>{tr("Place the code beside the complete ticket and take one clear photo.", "कोड को पूरी टिकट के पास रखकर एक साफ़ तस्वीर लें।")}</small></p></div>
                    <div className="challenge-code"><small>{tr("YOUR ONE-TIME CODE", "आपका एक बार का कोड")}</small><strong>TW 482</strong></div>
                    <p className="challenge-note"><Icon name="info" size={16} />{tr("Do not write on, cut or damage the ticket. The prototype does not store this demo photo.", "टिकट पर न लिखें, न काटें और न ही इसे नुकसान पहुँचाएँ। प्रोटोटाइप यह डेमो तस्वीर सहेजता नहीं है।")}</p>
                  </div>
                  <BottomActions><button className="primary-button" onClick={() => { setPossessionConfirmed(true); setSurrenderStage("matched"); window.scrollTo({ top: 0, behavior: "auto" }); }}><Icon name="camera" />{tr("Take demo possession photo", "डेमो कब्ज़े की तस्वीर लें")}</button></BottomActions>
                </>
              )}
              {surrenderStage === "matched" && (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("REMOTE SURRENDER · PROPOSED", "ऑनलाइन समर्पण · प्रस्तावित")}</p><h1>{tr("Review the ticket-record change.", "टिकट रिकॉर्ड में बदलाव जाँचें।")}</h1><p>{tr("The booking mobile and present possession have been checked. Your confirmation would request one authorised PRS update.", "बुकिंग मोबाइल और मौजूदा कब्ज़े की जाँच हो गई है। आपकी पुष्टि एक अधिकृत PRS बदलाव का अनुरोध करेगी।")}</p></div>
                  <div className="surrender-match">
                    <span className="rule-ok"><Icon name="check" size={15} /></span>
                    <p><b>PNR {ticketData.identifier}</b><small>{ticketData.origin} → {ticketData.destination} · {formatJourneyDate(ticketData.date, lang)}</small></p>
                  </div>
                  <div className="record-change" aria-label={tr("Proposed ticket record change", "प्रस्तावित टिकट रिकॉर्ड बदलाव")}><div><small>{tr("BEFORE", "पहले")}</small><b>{tr("Train cancelled", "ट्रेन रद्द")}</b><span>{tr("Refund not collected", "रिफंड नहीं मिला")}</span></div><Icon name="arrow" size={22} /><div className="after"><small>{tr("AFTER · SIMULATED", "बाद में · नकली")}</small><b>{tr("Remote surrender recorded", "ऑनलाइन समर्पण दर्ज")}</b><span>{tr("Refund instruction allowed", "रिफंड निर्देश की अनुमति")}</span></div></div>
                  <div className="simulation-disclosure"><Icon name="info" size={17} />{tr("A real service would need an approved PRS integration to make this record change. The prototype simulates it and does not alter any Railway system.", "वास्तविक सेवा को यह बदलाव करने के लिए स्वीकृत PRS कनेक्शन चाहिए। प्रोटोटाइप इसे नकली रूप से दिखाता है और किसी रेलवे सिस्टम को नहीं बदलता।")}</div>
                  <label className="consent-row"><input type="checkbox" checked={surrenderConsent} onChange={(event) => setSurrenderConsent(event.target.checked)} /><span><b>{tr("I request remote surrender of this ticket.", "मैं इस टिकट के ऑनलाइन समर्पण का अनुरोध करता/करती हूँ।")}</b><small>{tr("I understand that an authorised record update—not this photo—must prevent another refund.", "मैं समझता/समझती हूँ कि अधिकृत रिकॉर्ड बदलाव—यह तस्वीर नहीं—दूसरे रिफंड को रोकेगा।")}</small></span></label>
                  <BottomActions><button className="primary-button" disabled={!surrenderConsent || !possessionConfirmed || !otpVerified} onClick={saveRemoteSurrender}>{tr("Record remote surrender", "ऑनलाइन समर्पण दर्ज करें")}<Icon name="arrow" /></button><button className="secondary-button" onClick={() => { setPossessionConfirmed(false); setSurrenderConsent(false); setSurrenderStage("ready"); window.scrollTo({ top: 0, behavior: "auto" }); }}>{tr("Retake demo photo", "डेमो तस्वीर दोबारा लें")}</button></BottomActions>
                </>
              )}
              {surrenderStage === "recorded" && (
                <div className="surrender-success">
                  <div className="success-orbit paid"><span><Icon name="check" size={34} /></span></div>
                  <p className="eyebrow">{tr(`REMOTE SURRENDER RECEIPT ${surrenderReceipt?.reference ?? "TW-RS-824"}`, `ऑनलाइन समर्पण रसीद ${surrenderReceipt?.reference ?? "TW-RS-824"}`)}</p>
                  <h1>{existingReceiptFound ? tr("Existing receipt reopened.", "पुरानी रसीद फिर खोली गई।") : tr("Remote surrender recorded — simulated.", "ऑनलाइन समर्पण दर्ज — नकली।")}</h1>
                  <p className="hero-sub">{tr("One ticket-record update has been saved in this prototype. Repeating the request returns this same receipt instead of creating another refund.", "इस प्रोटोटाइप में टिकट रिकॉर्ड का एक बदलाव सहेजा गया है। अनुरोध दोहराने पर दूसरा रिफंड बनाने के बजाय यही रसीद लौटती है।")}</p>
                  <div className="receipt-facts"><p><span>PNR</span><b>{surrenderReceipt?.pnrMasked ?? "24••••••90"}</b></p><p><span>{tr("Journey", "यात्रा")}</span><b>{surrenderReceipt?.route ?? `${ticketData.origin} → ${ticketData.destination}`}</b></p><p><span>{tr("Cancellation confirmed", "रद्दीकरण पुष्ट")}</span><b>{surrenderReceipt?.cancellationConfirmedAt ?? cancellationEvent?.decidedAt}</b></p><p><span>{tr("Surrender recorded", "समर्पण दर्ज")}</span><b>{surrenderReceipt?.surrenderRecordedAt}</b></p><p><span>{tr("Refund amount", "रिफंड राशि")}</span><b>₹{(surrenderReceipt?.amount ?? ticketData.fare).toLocaleString("en-IN")}</b></p></div>
                  <div className="simulation-disclosure"><Icon name="info" size={17} />{tr("Prototype receipt only. No live Railway record or real refund has been created.", "केवल प्रोटोटाइप रसीद। कोई असली रेलवे रिकॉर्ड या रिफंड नहीं बना है।")}</div>
                  <BottomActions><button className="primary-button" onClick={() => go("payout")}>{tr("Continue to refund destination", "रिफंड के स्थान पर आगे बढ़ें")}<Icon name="arrow" /></button></BottomActions>
                </div>
              )}
            </div>
          )}

          {screen === "assisted" && (
            <div className="screen">
              {!assistanceCreated ? (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("ASSISTED REVIEW", "सहायता से जाँच")}</p><h1>{assistedReason === "multi_passenger" ? tr("A refund recipient must be confirmed.", "रिफंड पाने वाले की पुष्टि ज़रूरी है।") : assistedReason === "beneficiary" ? tr("The account name needs review.", "खाते के नाम की जाँच ज़रूरी है।") : assistedReason === "record" ? tr("The ticket record needs help.", "टिकट रिकॉर्ड के लिए सहायता चाहिए।") : tr("You are not stuck.", "आपकी प्रक्रिया यहाँ नहीं रुकेगी।")}</h1><p>{assistedReason === "multi_passenger" ? tr("This cash-paid ticket has more than one passenger. The prototype will not guess who should receive the refund.", "इस नकद टिकट पर एक से अधिक यात्री हैं। प्रोटोटाइप यह अनुमान नहीं लगाएगा कि रिफंड किसे मिलना चाहिए।") : assistedReason === "beneficiary" ? tr("The refund destination does not match the expected passenger name, so payment remains on hold.", "रिफंड खाते का नाम अपेक्षित यात्री से मेल नहीं खाता, इसलिए भुगतान रुका रहेगा।") : assistedReason === "record" ? tr("A support request preserves the entered details while an authorised record is checked.", "अधिकृत रिकॉर्ड की जाँच के दौरान सहायता अनुरोध भरी गई जानकारी सुरक्षित रखता है।") : tr("If the booking mobile is unavailable, support must verify ownership before any surrender or refund can continue.", "अगर बुकिंग मोबाइल उपलब्ध नहीं है, तो समर्पण या रिफंड से पहले सहायता कर्मचारी मालिकाना जाँचेंगे।")}</p></div>
                  <div className="assist-steps">
                    <div><span>1</span><p><b>{tr("Keep the original ticket", "मूल टिकट पास रखें")}</b><small>{assistedReason === "multi_passenger" ? tr("No ticket surrender is recorded until the recipient is resolved.", "रिफंड पाने वाला तय होने तक टिकट समर्पण दर्ज नहीं होगा।") : tr("Support would compare it with the booking record.", "सहायता कर्मचारी इसे बुकिंग रिकॉर्ड से मिलाएँगे।")}</small></p></div>
                    <div><span>2</span><p><b>{tr("Use a reachable mobile", "चालू मोबाइल नंबर दें")}</b><small>{tr("Use the sample number below—not a real number.", "नीचे दिया नमूना नंबर इस्तेमाल करें—असली नंबर नहीं।")}</small></p></div>
                    <div><span>3</span><p><b>{tr("Save the help reference", "सहायता संदर्भ सुरक्षित रखें")}</b><small>{tr("It lets you continue without repeating the ticket details.", "इससे टिकट की जानकारी दोबारा भरे बिना आगे बढ़ सकते हैं।")}</small></p></div>
                  </div>
                  <label className="assist-mobile data-field">
                    <span className="field-label">{tr("REACHABLE MOBILE · SAMPLE ONLY", "चालू मोबाइल · केवल नमूना")}</span>
                    <input aria-label={tr("Reachable sample mobile number", "चालू नमूना मोबाइल नंबर")} inputMode="numeric" maxLength={10} placeholder="98765 43210" value={assistanceMobile} onChange={(event) => setAssistanceMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} />
                    <small className="field-hint">{tr("Do not enter a real phone number here.", "यहाँ असली फ़ोन नंबर न भरें।")}</small>
                  </label>
                  <button className="sample-fill" onClick={() => setAssistanceMobile("9876543210")}>{tr("Use sample number 98765 43210", "नमूना नंबर 98765 43210 इस्तेमाल करें")}</button>
                  <div className="safety-banner"><Icon name="shield" size={19} /><span><b>{tr("This does not approve the refund automatically", "इससे रिफंड अपने-आप मंज़ूर नहीं होता")}</b>{tr("Never share an OTP, Aadhaar number, bank password or payment PIN with support.", "सहायता कर्मचारी से OTP, आधार नंबर, बैंक पासवर्ड या भुगतान PIN कभी साझा न करें।")}</span></div>
                  <BottomActions><button className="primary-button" disabled={!/^\d{10}$/.test(assistanceMobile)} onClick={() => setAssistanceCreated(true)}>{tr("Create help request", "सहायता अनुरोध बनाएँ")}<Icon name="arrow" /></button></BottomActions>
                </>
              ) : (
                <div className="assist-success">
                  <div className="success-orbit paid"><span><Icon name="check" size={34} /></span></div>
                  <p className="eyebrow">{tr("HELP REFERENCE TW-HELP-2714", "सहायता संदर्भ TW-HELP-2714")}</p>
                  <h1>{tr("Your help request is ready.", "आपका सहायता अनुरोध तैयार है।")}</h1>
                  <p className="hero-sub">{tr("Keep this reference. The ticket must pass an authorised ownership review before any refund can continue.", "यह संदर्भ सुरक्षित रखें। रिफंड आगे बढ़ने से पहले टिकट की अधिकृत मालिकाना जाँच पूरी होनी चाहिए।")}</p>
                  <div className="plain-language"><b>{tr("What happens next", "आगे क्या होगा")}</b><p>{tr("The request remains on hold until the accepted verification route is completed.", "मान्य सत्यापन प्रक्रिया पूरी होने तक अनुरोध रुका रहेगा।")}</p></div>
                  <BottomActions>{assistedReason === "mobile" && <button className="primary-button" onClick={() => go("otp")}>{tr("Use the demo code instead", "इसके बजाय डेमो कोड इस्तेमाल करें")}<Icon name="arrow" /></button>}<button className="secondary-button" onClick={reset}>{tr("Return to home", "मुख्य पृष्ठ पर जाएँ")}</button></BottomActions>
                </div>
              )}
            </div>
          )}

          {screen === "payout" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{prsRecord?.originalPayment.kind === "pos" ? tr("ORIGINAL PAYMENT SOURCE", "मूल भुगतान स्रोत") : tr("CASH-PAID TICKET", "नकद भुगतान टिकट")}</p><h1>{prsRecord?.originalPayment.kind === "pos" ? tr("The refund will return to the original payment source.", "रिफंड मूल भुगतान स्रोत में लौटेगा।") : tr(`Where should ₹${ticketData.fare.toLocaleString("en-IN")} go?`, `₹${ticketData.fare.toLocaleString("en-IN")} कहाँ भेजें?`)}</h1><p>{prsRecord?.originalPayment.kind === "pos" ? tr("No new account is collected for a card-paid counter ticket.", "कार्ड से खरीदी काउंटर टिकट के लिए नया खाता नहीं लिया जाता।") : tr("A new destination is needed because this ticket was paid in cash. All details below are synthetic.", "नया खाता इसलिए ज़रूरी है क्योंकि टिकट का भुगतान नकद हुआ था। नीचे दी गई सभी जानकारी नकली है।")}</p></div>
              <div className="original-payment"><Icon name="wallet" size={19} /><span><small>{tr("ORIGINAL PAYMENT FOUND IN PRS RECORD", "PRS रिकॉर्ड में मूल भुगतान मिला")}</small><b>{prsRecord?.originalPayment.kind === "pos" ? prsRecord.originalPayment.maskedDestination : tr("Cash at PRS counter", "PRS काउंटर पर नकद")}</b></span></div>
              {prsRecord?.originalPayment.kind === "pos" ? (
                <div className="payout-card selected"><span className="radio-dot" /><div><small>{tr("REFUND DESTINATION", "रिफंड खाता")}</small><b>{prsRecord.originalPayment.maskedDestination}</b><p>{tr("Returned to the source used at booking", "बुकिंग में इस्तेमाल स्रोत पर वापस")}</p></div><span className="verified-badge"><Icon name="check" size={13} /> {tr("ORIGINAL", "मूल")}</span></div>
              ) : (
                <>
                  <div className="method-tabs" role="tablist" aria-label={tr("Refund destination", "रिफंड का स्थान")}><button role="tab" aria-selected={payout === "upi"} className={payout === "upi" ? "active" : ""} onClick={() => setPayout("upi")}><Icon name="phone" />UPI</button><button role="tab" aria-selected={payout === "bank"} className={payout === "bank" ? "active" : ""} onClick={() => setPayout("bank")}><Icon name="wallet" />{tr("Bank account", "बैंक खाता")}</button></div>
                  {payout === "upi" ? <div className="payout-card selected"><span className="radio-dot" /><div><small>UPI ID</small><b>asha.rail@okaxis</b><p>{tr("Synthetic bank-returned name: Asha P.", "नकली बैंक से मिला नाम: आशा P.")}</p></div><span className="verified-badge"><Icon name="check" size={13} /> {tr("NAME MATCHED", "नाम मिला")}</span></div> : <div className="payout-card selected"><span className="radio-dot" /><div><small>{tr("BANK ACCOUNT", "बैंक खाता")}</small><b>{tr("State Bank", "स्टेट बैंक")} · •••• 1842</b><p>{tr("Synthetic bank-returned name: Asha P.", "नकली बैंक से मिला नाम: आशा P.")}</p></div><span className="verified-badge"><Icon name="check" size={13} /> {tr("NAME MATCHED", "नाम मिला")}</span></div>}
                </>
              )}
              <div className="recipient-check"><Icon name="shield" /><div><b>{tr("Destination and claimant checked separately", "खाता और दावेदार अलग-अलग जाँचे गए")}</b><p>{prsRecord?.originalPayment.kind === "pos" ? tr("The refund returns to the source recorded with this synthetic booking.", "रिफंड इस नकली बुकिंग में दर्ज मूल स्रोत पर लौटता है।") : tr("A mocked bank-name check confirms the destination. The booking-mobile OTP and possession photo confirm the claimant.", "नकली बैंक नाम जाँच खाते की पुष्टि करती है। बुकिंग-मोबाइल OTP और कब्ज़े की तस्वीर दावेदार की पुष्टि करते हैं।")}</p></div></div>
              {prsRecord?.originalPayment.kind !== "pos" && <button className="beneficiary-help" onClick={() => { setAssistedReason("beneficiary"); go("assisted"); }}>{tr("The account name does not match", "खाते का नाम मेल नहीं खाता")}</button>}
              <div className="privacy-note"><Icon name="lock" size={18} /><span>{tr("Only masked payment details are shown.", "केवल छिपी हुई भुगतान जानकारी दिखाई जाती है।")}</span></div>
              <BottomActions><button className="primary-button" onClick={() => go("review")}>{tr("Review refund", "रिफंड की जाँच करें")}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "review" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("FINAL REVIEW", "अंतिम जाँच")}</p><h1>{tr("Ready to start the refund.", "रिफंड शुरू करने के लिए तैयार।")}</h1><p>{tr("Nothing is paid until this final confirmation. Review the facts and consent below.", "अंतिम पुष्टि से पहले कोई भुगतान नहीं होगा। नीचे जानकारी और सहमति जाँचें।")}</p></div>
              <div className="refund-total"><span><small>{ticketData.ticketType === "uts" ? tr("REFUND AMOUNT", "रिफंड राशि") : tr("FULL REFUND", "पूरा रिफंड")}</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b></span><span className="no-fee">₹0 {tr("fee", "शुल्क")}</span></div>
              <div className="review-list"><div><span>{tr("Ticket", "टिकट")}</span><b>PNR {ticketData.identifier}</b></div><div><span>{tr("Journey", "यात्रा")}</span><b>{ticketData.origin} → {ticketData.destination}</b></div><div><span>{tr("Journey date", "यात्रा की तारीख")}</span><b>{formatJourneyDate(ticketData.date, lang)}</b></div><div><span>{tr("Cancellation", "रद्दीकरण")}</span><b className="green-text"><Icon name="check" size={14} /> {tr("Final cancellation confirmed · simulated", "अंतिम रद्दीकरण पुष्ट · नकली")}</b></div><div><span>{tr("Ownership", "मालिकाना")}</span><b className="green-text"><Icon name="check" size={14} /> {tr("Booking mobile + possession confirmed", "बुकिंग मोबाइल + कब्ज़ा पुष्ट")}</b></div><div><span>{tr("Paper ticket", "कागज़ी टिकट")}</span><b className="green-text"><Icon name="check" size={14} /> {tr("Remote surrender recorded · simulated", "ऑनलाइन समर्पण दर्ज · नकली")}</b></div><div><span>{tr("Refund account", "रिफंड खाता")}</span><b>{prsRecord?.originalPayment.kind === "pos" ? prsRecord.originalPayment.maskedDestination : payout === "upi" ? "asha.rail@okaxis" : "SBI · •••• 1842"}</b></div></div>
              <button className="edit-link" onClick={() => go("payout")}><Icon name="back" size={16} /> {tr("Change refund destination", "रिफंड खाता बदलें")}</button>
              <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><b>{tr("I confirm these details are correct.", "मैं पुष्टि करता/करती हूँ कि यह जानकारी सही है।")}</b><small>{tr("I agree to use these details to create one refund request for this journey.", "मैं इस यात्रा के लिए एक रिफंड अनुरोध बनाने में इस जानकारी के उपयोग से सहमत हूँ।")}</small></span></label>
              <div className="lock-preview"><Icon name="lock" /><div><b>{tr("We check for an existing refund first", "हम पहले पुराने रिफंड की जाँच करते हैं")}</b><p>{tr("This prevents the same ticket from being refunded twice, even if the button is tapped again.", "बटन दोबारा दबने पर भी इससे एक ही टिकट का दो बार रिफंड नहीं होता।")}</p></div></div>
              <BottomActions><button className="primary-button" disabled={!consent} onClick={startRefund}>{tr(`Confirm ₹${ticketData.fare.toLocaleString("en-IN")} refund`, `₹${ticketData.fare.toLocaleString("en-IN")} रिफंड की पुष्टि करें`)}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "tracking" && (
            <div className="screen tracking-screen">
              <div className={`success-orbit ${paid ? "paid" : ""}`}><span><Icon name="check" size={34} /></span></div>
              <p className="eyebrow">{tr(`SIMULATED CLAIM ${surrenderReceipt?.reference ?? "TW-RS-824"}`, `नकली दावा ${surrenderReceipt?.reference ?? "TW-RS-824"}`)}</p>
              <h1>{paid ? tr(`₹${ticketData.fare.toLocaleString("en-IN")} refund marked paid.`, `₹${ticketData.fare.toLocaleString("en-IN")} रिफंड भुगतान दर्ज।`) : tr("Your refund instruction is being processed.", "आपका रिफंड निर्देश जारी है।")}</h1>
              <p className="hero-sub">{paid ? tr("Sent to your selected refund account. Keep this reference for your records.", "चुने हुए रिफंड खाते में भेज दिया गया है। यह संदर्भ सुरक्षित रखें।") : tr("Your request is confirmed. This page will update when the transfer is complete.", "आपके अनुरोध की पुष्टि हो गई है। ट्रांसफर पूरा होने पर यह पेज अपडेट होगा।")}</p>
              <div className="tracking-amount"><small>{tr("REFUND AMOUNT", "रिफंड राशि")}</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b><span className={paid ? "paid-state" : "pending-state"}>{paid ? tr("PAID", "भुगतान हुआ") : tr("PROCESSING", "प्रक्रिया में")}</span></div>
              <div className="timeline">
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{tr("Refund request created", "रिफंड अनुरोध बना")}</b><small>{tr("24 Aug · 10:41:08", "24 अगस्त · 10:41:08")}</small></span></div>
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{tr("Final cancellation confirmed · simulated", "अंतिम रद्दीकरण पुष्ट · नकली")}</b><small>{cancellationEvent?.decidedAt ?? tr("Authorised event required in production", "वास्तविक सेवा में अधिकृत घटना ज़रूरी")}</small></span></div>
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{tr("Remote surrender recorded · simulated", "ऑनलाइन समर्पण दर्ज · नकली")}</b><small>{tr(`Receipt ${surrenderReceipt?.reference ?? "TW-RS-824"}`, `रसीद ${surrenderReceipt?.reference ?? "TW-RS-824"}`)}</small></span></div>
                <div className={paid ? "complete" : "current"}><i>{paid ? <Icon name="check" size={13} /> : <span />}</i><span><b>{paid ? tr("Paid to selected account", "चुने खाते में भुगतान हुआ") : tr("Refund transfer in progress", "रिफंड ट्रांसफर जारी है")}</b><small>{paid ? tr("Payment reference 4268•••914", "भुगतान संदर्भ 4268•••914") : tr("This page updates automatically", "यह पेज अपने-आप अपडेट होगा")}</small></span></div>
              </div>
              <div className="simulation-disclosure"><Icon name="info" size={17} />{tr("End-to-end prototype status. No real Railway record or payment was changed.", "यह पूरी प्रोटोटाइप स्थिति है। कोई असली रेलवे रिकॉर्ड या भुगतान नहीं बदला।")}</div>
              <BottomActions>
                {!paid && <button className="primary-button" disabled>{retrying ? tr("Sending refund…", "रिफंड भेजा जा रहा है…") : tr("Checking refund status…", "रिफंड की स्थिति जाँची जा रही है…")}</button>}
                {paid && <button className="secondary-button" onClick={() => reset()}>{tr("Start another ticket", "दूसरी टिकट शुरू करें")}</button>}
              </BottomActions>
            </div>
          )}
        </section>
      </div>

      <footer className="site-footer">
        <b>Ticket Wapas · टिकट वापस</b>
        <span>{tr("Independent prototype using synthetic data. No real Railway system or refund is connected. Not affiliated with Indian Railways, IRCTC or the Government of India.", "स्वतंत्र प्रोटोटाइप, जिसमें नकली डेटा इस्तेमाल होता है। कोई असली रेलवे सिस्टम या रिफंड जुड़ा नहीं है। भारतीय रेल, IRCTC या भारत सरकार से संबद्ध नहीं।")}</span>
        <span><a href="/service-information">{tr("Service information", "सेवा की जानकारी")}</a> · <a href="/status">{tr("Refund status", "रिफंड स्थिति")}</a> · <a href="/authority">{tr("Authority view", "प्राधिकरण दृश्य")}</a></span>
      </footer>

    </main>
  );
}
