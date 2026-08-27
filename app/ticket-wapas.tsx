"use client";

import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import { SampleClaim, writeSampleClaim } from "./sample-claims";

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
  mobile: string | null;
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
  mobile?: string | null;
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
  passengers: 2,
  fare: 4860,
  mobile: "+91 •••••• 2714",
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
  mobile: null,
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
    mobile: null,
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
    mobile: text(raw.mobile) || null,
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
  const [surrenderStage, setSurrenderStage] = useState<SurrenderStage>("ready");
  const [payout, setPayout] = useState<Payout>("upi");
  const [consent, setConsent] = useState(false);
  const [paid, setPaid] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [assistanceMobile, setAssistanceMobile] = useState("");
  const [assistanceCreated, setAssistanceCreated] = useState(false);
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
  const isTrainSpecificUts = ticketData.ticketType === "uts" && /^\d{5}$/.test(effectiveTrainNumber);
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
    setSurrenderStage("ready");
    setPayout("upi");
    setConsent(false);
    setPaid(false);
    setRetrying(false);
    setAssistanceMobile("");
    setAssistanceCreated(false);
    setUtsReviewCreated(false);
  }

  function go(next: Screen) {
    if (next === "review") setConsent(false);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function currentClaim(status: SampleClaim["status"]): SampleClaim {
    return {
      id: ticketData.ticketType === "uts" ? "TW-UTS-613" : "TW-824-613",
      ticket: ticketData.ticketType === "uts" ? ticketData.identifier : `PNR ${ticketData.identifier}`,
      route: `${ticketData.origin} → ${ticketData.destination}`,
      amount: ticketData.fare,
      status,
      updated: "Just now",
      destination: payout === "upi" ? "UPI · asha.rail@okaxis" : "Bank account · •••• 1842",
    };
  }

  function startRefund() {
    const processingClaim = currentClaim("processing");
    setPaid(false);
    setRetrying(true);
    writeSampleClaim(processingClaim);
    go("tracking");
    window.setTimeout(() => {
      setPaid(true);
      setRetrying(false);
      writeSampleClaim({ ...processingClaim, status: "paid", updated: "Just now" });
    }, 900);
  }

  function back() {
    if (screen === "assisted") {
      go("otp");
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
    go("details");
  }

  function selectTicketType(ticketType: TicketType) {
    if (ticketData.ticketType === ticketType) return;
    setTicketData(emptyTicket(ticketType));
    setTicketConfirmed(false);
    setUtsReviewCreated(false);
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
        <b>{tr("Paper counter-ticket support", "कागज़ी काउंटर टिकट सहायता")}</b>
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
                <p><b>{tr("Paper railway ticket refund", "कागज़ी रेलवे टिकट रिफंड")}</b><small>{tr("Guided citizen service", "निर्देशित नागरिक सेवा")}</small></p>
              </div>
              <h1>{tr("Train cancelled? Refund your paper ticket.", "ट्रेन रद्द हुई? कागज़ी टिकट का रिफंड पाएँ।")}</h1>
              <p className="hero-sub">{tr("Check your counter ticket and complete the refund without another station visit.", "काउंटर टिकट जाँचें और स्टेशन दोबारा जाए बिना रिफंड पूरा करें।")}</p>
              <div className="home-actions">
                <button className="primary-button" onClick={() => go("capture")}>{c.start}<Icon name="arrow" /></button>
              </div>
              <div className="home-requirements" aria-label={tr("What you need", "क्या चाहिए")}>
                <span><Icon name="ticket" size={18} /><p><b>{tr("Original paper ticket", "मूल कागज़ी टिकट")}</b><small>{tr("Keep it with you", "इसे अपने पास रखें")}</small></p></span>
                <span><Icon name="file" size={18} /><p><b>{tr("PNR or UTS number", "PNR या UTS नंबर")}</b><small>{tr("We detect the ticket type", "हम टिकट का प्रकार पहचानते हैं")}</small></p></span>
              </div>
              <p className="home-help">{tr("No login required · Usually takes about 2 minutes", "लॉगिन की ज़रूरत नहीं · आमतौर पर लगभग 2 मिनट")} · <a href="/service-information">{tr("Service information", "सेवा की जानकारी")}</a></p>
            </div>
          )}

          {screen === "capture" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("ADD YOUR TICKET", "अपनी टिकट जोड़ें")}</p><h1>{tr("How would you like to add it?", "टिकट कैसे जोड़ना चाहेंगे?")}</h1><p>{tr("Use one of the sample tickets on this page—never a real passenger ticket.", "इस पेज पर दिए नमूना टिकटों में से एक इस्तेमाल करें—असली यात्री टिकट नहीं।")}</p></div>
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
                <button onClick={() => runSample("uts")} disabled={analysis === "reading"}><span className="sample-ticket-icon"><Icon name="ticket" size={22} /></span><p><small>{tr("UNRESERVED UTS · SYNTHETIC", "अनारक्षित UTS · नकली")}</small><b>Jan Shatabdi · NDLS → DDN</b><em>UTS7A4K219 · {tr("No PNR", "PNR नहीं")}</em></p><Icon name="arrow" size={17} /></button>
              </div>
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
              <div className="privacy-note"><Icon name="lock" size={18} /><span><b>{tr("Your ticket image is not stored.", "आपकी टिकट की तस्वीर सहेजी नहीं जाती।")}</b> {tr("Only confirmed fields move to the eligibility check.", "केवल पुष्टि की गई जानकारी योग्यता जाँच में जाती है।")}</span></div>
              <BottomActions><button className="primary-button" onClick={() => go("eligibility")} disabled={!requiredFieldsReady || !ticketConfirmed}>{tr("Confirm & check cancellation", "पुष्टि करें और रद्द होने की जाँच करें")}<Icon name="arrow" /></button><button className="text-button" onClick={() => go("capture")}>{tr("Use a different ticket image", "दूसरी टिकट की तस्वीर इस्तेमाल करें")}</button></BottomActions>
            </div>
          )}

          {screen === "eligibility" && (
            <div className="screen">
              {ticketData.ticketType === "uts" && !isTrainSpecificUts ? (
                !utsReviewCreated ? (
                  <>
                    <div className="screen-heading"><p className="eyebrow">{tr("UTS SERVICE CHECK", "UTS सेवा जाँच")}</p><h1>{tr("One more check is needed.", "एक और जाँच ज़रूरी है।")}</h1><p>{tr("This general ticket is valid for a route, not one reserved train. One cancelled train may not make it refundable if another permitted service was available.", "यह जनरल टिकट किसी एक आरक्षित ट्रेन के बजाय मार्ग के लिए मान्य है। अगर दूसरी मान्य सेवा उपलब्ध थी, तो एक ट्रेन रद्द होने से रिफंड तय नहीं होता।")}</p></div>
                    <div className="decision-card operating"><span className="decision-icon"><Icon name="info" size={28} /></span><div><small>{tr("AUTHORISED UTS CHECK REQUIRED", "अधिकृत UTS जाँच ज़रूरी")}</small><strong>{tr("Refund not started", "रिफंड शुरू नहीं हुआ")}</strong><p>{tr("We will not invent a train link or promise the wrong amount.", "हम ट्रेन का गलत संबंध नहीं बनाएँगे या गलत राशि का वादा नहीं करेंगे।")}</p></div></div>
                    <div className="rule-list">
                      <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("Unreserved UTS ticket confirmed", "अनारक्षित UTS टिकट पुष्ट")}</b><small>{ticketData.identifier}</small></p></div>
                      <div><span className="rule-bad"><Icon name="info" size={15} /></span><p><b>{tr("No specific train printed", "कोई खास ट्रेन नहीं छपी")}</b><small>{tr("The ticket can cover a route or time window", "टिकट किसी मार्ग या समय अवधि के लिए हो सकती है")}</small></p></div>
                      <div><span className="rule-bad"><Icon name="route" size={15} /></span><p><b>{tr("Alternate-service check pending", "वैकल्पिक सेवा की जाँच बाकी")}</b><small>{tr("An authorised UTS rules service must confirm special cancellation", "अधिकृत UTS नियम सेवा को विशेष रद्दीकरण पुष्ट करना होगा")}</small></p></div>
                    </div>
                    <BottomActions><button className="primary-button" onClick={() => { setUtsReviewCreated(true); window.scrollTo({ top: 0, behavior: "auto" }); }}>{tr("Create UTS verification request", "UTS जाँच अनुरोध बनाएँ")}<Icon name="arrow" /></button><button className="secondary-button" onClick={() => go("details")}>{tr("Edit ticket details", "टिकट की जानकारी बदलें")}</button></BottomActions>
                  </>
                ) : (
                  <div className="assist-success">
                    <div className="success-orbit paid"><span><Icon name="check" size={34} /></span></div>
                    <p className="eyebrow">{tr("UTS REFERENCE TW-UTS-HELP-219", "UTS संदर्भ TW-UTS-HELP-219")}</p>
                    <h1>{tr("Verification request created.", "जाँच अनुरोध बन गया।")}</h1>
                    <p className="hero-sub">{tr("Your ticket details are saved with this request. An authorised service would check whether another permitted train remained available before deciding the refund.", "आपकी टिकट की जानकारी इस अनुरोध के साथ सहेजी गई है। अधिकृत सेवा रिफंड तय करने से पहले जाँचेगी कि दूसरी मान्य ट्रेन उपलब्ध थी या नहीं।")}</p>
                    <div className="plain-language"><b>{tr("No refund was started", "रिफंड शुरू नहीं हुआ")}</b><p>{tr("This protects citizens from an incorrect promise and Railways from refunding a ticket that could still be used on another service.", "यह नागरिकों को गलत वादे से और रेलवे को दूसरी सेवा में उपयोग हो सकने वाली टिकट का गलत रिफंड देने से बचाता है।")}</p></div>
                    <BottomActions><button className="primary-button" onClick={reset}>{tr("Return to home", "मुख्य पृष्ठ पर जाएँ")}<Icon name="arrow" /></button></BottomActions>
                  </div>
                )
              ) : (
                <>
              <div className="screen-heading"><p className="eyebrow">{tr("ELIGIBILITY CHECK", "योग्यता जाँच")}</p><h1>{ticketData.ticketType === "uts" ? tr("Special cancellation is available.", "विशेष रद्दीकरण उपलब्ध है।") : tr("Full refund is available.", "पूरा रिफंड उपलब्ध है।")}</h1><p>{ticketData.ticketType === "uts" ? tr("This train-specific UTS ticket matches the special-cancellation record.", "यह ट्रेन-विशिष्ट UTS टिकट विशेष रद्दीकरण रिकॉर्ड से मेल खाती है।") : tr("Your confirmed ticket details match the cancellation record.", "आपकी पुष्टि की गई टिकट जानकारी रद्दीकरण रिकॉर्ड से मेल खाती है।")}</p></div>
              <div className="decision-card eligible"><span className="decision-icon"><Icon name="check" size={30} /></span><div><small>{ticketData.ticketType === "uts" ? tr("ELIGIBLE · UTS SPECIAL CANCELLATION", "योग्य · UTS विशेष रद्दीकरण") : tr("ELIGIBLE · 3 OF 3 CHECKS PASSED", "योग्य · 3 में से 3 जाँच पूरी")}</small><strong>₹{ticketData.fare.toLocaleString("en-IN")} {ticketData.ticketType === "uts" ? tr("refundable fare", "वापसी योग्य किराया") : tr("full fare", "पूरा किराया")}</strong><p>{ticketData.ticketType === "uts" ? tr("Amount returned by the UTS rule check", "UTS नियम जाँच से मिली राशि") : tr("No cancellation charge", "कोई रद्दीकरण शुल्क नहीं")} · {ticketData.passengers === 1 ? tr("1 passenger", "1 यात्री") : ticketData.passengers > 1 ? tr(`${ticketData.passengers} passengers`, `${ticketData.passengers} यात्री`) : tr("passenger count verified by the ticket record", "टिकट रिकॉर्ड से यात्रियों की संख्या सत्यापित")}</p></div></div>
              <div className="rule-list">
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("Train cancellation found", "ट्रेन रद्द होने की जानकारी मिली")}</b><small>{ticketData.ticketType === "uts" ? tr("UTS service record · train-specific ticket", "UTS सेवा रिकॉर्ड · ट्रेन-विशिष्ट टिकट") : tr("Cancellation record · 23 Aug, 18:42", "रद्दीकरण रिकॉर्ड · 23 अगस्त, 18:42")}</small></p></div>
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{ticketData.ticketType === "uts" ? tr("Special-cancellation condition met", "विशेष रद्दीकरण की शर्त पूरी") : tr("Physical counter ticket confirmed", "भौतिक काउंटर टिकट की पुष्टि हुई")}</b><small>{ticketData.ticketType === "uts" ? tr("This sample was issued for the cancelled train—not an open route ticket", "यह नमूना रद्द ट्रेन के लिए जारी हुआ था—खुले मार्ग की टिकट नहीं") : tr("The ticket type is eligible for this journey", "इस यात्रा के लिए टिकट का प्रकार योग्य है")}</small></p></div>
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("No earlier refund found", "पहले का कोई रिफंड नहीं मिला")}</b><small>{tr("This ticket can continue", "यह टिकट आगे बढ़ सकती है")}</small></p></div>
              </div>
              <details className="verification-details">
                <summary>{tr("How we check a refund", "रिफंड की जाँच कैसे होती है")}</summary>
                <ol>
                  <li><span><Icon name="ticket" size={17} /></span><p><b>{tr("Ticket record", "टिकट रिकॉर्ड")}</b><small>{ticketData.ticketType === "uts" ? tr("Match the UTS number and printed details to an authorised UTS record.", "UTS नंबर और छपी जानकारी को अधिकृत UTS रिकॉर्ड से मिलाएँ।") : tr("Match the ticket to an authorised PRS record.", "टिकट को अधिकृत PRS रिकॉर्ड से मिलाएँ।")}</small></p></li>
                  <li><span><Icon name="route" size={17} /></span><p><b>{tr("Train status", "ट्रेन की स्थिति")}</b><small>{tr("Check cancellation and any later restoration for this date and route.", "इस तारीख और मार्ग के लिए रद्दीकरण और बाद की बहाली जाँचें।")}</small></p></li>
                  <li><span><Icon name="check" size={17} /></span><p><b>{tr("Refund rule", "रिफंड नियम")}</b><small>{ticketData.ticketType === "uts" ? tr("Check whether the ticket is train-specific or another permitted service remained available.", "जाँचें कि टिकट किसी खास ट्रेन की है या दूसरी मान्य सेवा उपलब्ध थी।") : tr("Apply the published deadline and amount rule.", "प्रकाशित समय-सीमा और राशि का नियम लागू करें।")}</small></p></li>
                  <li><span><Icon name="shield" size={17} /></span><p><b>{tr("Ticket holder", "टिकट धारक")}</b><small>{ticketData.ticketType === "uts" ? tr("Use the original paper ticket and a fresh one-time photo; there is no booking mobile.", "मूल कागज़ी टिकट और एक नई तस्वीर इस्तेमाल करें; बुकिंग मोबाइल नहीं होता।") : tr("Check the booking mobile and original paper ticket.", "बुकिंग मोबाइल और मूल कागज़ी टिकट जाँचें।")}</small></p></li>
                  <li><span><Icon name="wallet" size={17} /></span><p><b>{tr("Refund destination", "रिफंड का स्थान")}</b><small>{tr("Use the original payment source first; verify a new destination only when needed.", "पहले मूल भुगतान स्रोत इस्तेमाल करें; ज़रूरत पर ही नया खाता जाँचें।")}</small></p></li>
                </ol>
              </details>
              <BottomActions><button className="primary-button" onClick={() => go(ticketData.ticketType === "uts" ? "surrender" : "otp")}>{ticketData.ticketType === "uts" ? tr("Verify the original ticket", "मूल टिकट सत्यापित करें") : tr("Verify ticket ownership", "टिकट का मालिकाना सत्यापित करें")}<Icon name="arrow" /></button></BottomActions>
                </>
              )}
            </div>
          )}

          {screen === "otp" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("PROVE OWNERSHIP", "मालिकाना साबित करें")}</p><h1>{tr("Check the booking mobile.", "बुकिंग वाला फ़ोन जाँचें।")}</h1><p>{tr("The booking record returned", "बुकिंग रिकॉर्ड से मिला नंबर है")} <b>+91 •••••• 2714</b>{tr(". A 6-digit code was sent there.", "। इसी पर 6 अंकों का कोड भेजा गया है।")}</p></div>
              <div className="otp-row" aria-label="One-time password">
                {otp.map((digit, index) => <input key={index} inputMode="numeric" maxLength={1} value={digit} aria-label={tr(`OTP digit ${index + 1}`, `OTP अंक ${index + 1}`)} onChange={(event) => { const copy = [...otp]; copy[index] = event.target.value.replace(/\D/g, ""); setOtp(copy); }} />)}
              </div>
              <div className="demo-code"><span><Icon name="sparkle" size={16} /> {tr("DEMO CODE", "डेमो कोड")}</span><b>271406</b><button onClick={() => setOtp(["2", "7", "1", "4", "0", "6"])}>{tr("Fill code", "कोड भरें")}</button></div>
              <p className="attempt-note"><Icon name="shield" size={16} /> {tr("3 attempts maximum · code expires in 10 minutes", "अधिकतम 3 कोशिशें · कोड 10 मिनट में समाप्त होगा")}</p>
              <button className="phone-help" onClick={() => go("assisted")}><Icon name="phone" size={19} /><span><b>{tr("I no longer have access to this number", "अब यह नंबर मेरे पास नहीं है")}</b><small>{tr("Get an assisted verification reference", "सहायता से सत्यापन का संदर्भ पाएँ")}</small></span><Icon name="arrow" size={18} /></button>
              <BottomActions><button className="primary-button" disabled={otp.join("") !== "271406"} onClick={() => go("surrender")}>{tr("Verify code", "कोड सत्यापित करें")}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "surrender" && (
            <div className="screen">
              {surrenderStage === "ready" && (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("DIGITAL TICKET SURRENDER", "डिजिटल टिकट समर्पण")}</p><h1>{tr("Cancel the paper ticket digitally.", "कागज़ी टिकट को ऑनलाइन रद्द करें।")}</h1><p>{tr("Take one fresh photo to show that the original ticket is with you.", "यह दिखाने के लिए एक नई तस्वीर लें कि मूल टिकट आपके पास है।")}</p></div>
                  <div className="surrender-challenge">
                    <div className="challenge-heading"><span><Icon name="camera" /></span><p><b>{tr("Take a one-time surrender photo", "एक बार इस्तेमाल होने वाली तस्वीर लें")}</b><small>{tr("Place the code beside the full ticket and take one clear photo.", "कोड को पूरे टिकट के पास रखकर एक साफ़ तस्वीर लें।")}</small></p></div>
                    <div className="challenge-code"><small>{tr("YOUR ONE-TIME CODE", "आपका एक बार का कोड")}</small><strong>TW 482</strong></div>
                    <p className="challenge-note"><Icon name="info" size={16} />{tr("Do not write on, cut or damage the ticket.", "टिकट पर न लिखें, न काटें और न ही उसे नुकसान पहुँचाएँ।")}</p>
                  </div>
                  <BottomActions><button className="primary-button" onClick={() => { setSurrenderStage("matched"); window.scrollTo({ top: 0, behavior: "auto" }); }}><Icon name="camera" />{tr("Take demo surrender photo", "डेमो समर्पण तस्वीर लें")}</button></BottomActions>
                </>
              )}
              {surrenderStage === "matched" && (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("PHOTO CHECK COMPLETE", "तस्वीर की जाँच पूरी")}</p><h1>{tr("Your ticket is ready to be cancelled.", "आपका टिकट रद्द करने के लिए तैयार है।")}</h1><p>{ticketData.ticketType === "uts" ? tr("The fresh photo and printed UTS details match the ticket record.", "नई तस्वीर और छपी UTS जानकारी टिकट रिकॉर्ड से मेल खाती है।") : tr("The fresh photo, ticket details and booking mobile have been matched.", "नई तस्वीर, टिकट की जानकारी और बुकिंग मोबाइल का मिलान हो गया है।")}</p></div>
                  <div className="surrender-match">
                    <span className="rule-ok"><Icon name="check" size={15} /></span>
                    <p><b>{ticketData.ticketType === "uts" ? "UTS" : "PNR"} {ticketData.identifier}</b><small>{ticketData.origin} → {ticketData.destination} · {formatJourneyDate(ticketData.date, lang)}</small></p>
                  </div>
                  {ticketData.ticketType === "uts" && <div className="ticket-type-notice compact"><Icon name="shield" size={18} /><p><b>{tr("No booking-mobile OTP used", "बुकिंग-मोबाइल OTP इस्तेमाल नहीं हुआ")}</b><span>{tr("UTS counter tickets are not linked to a booking mobile. The ticket number, UTS record and fresh possession photo were checked instead.", "UTS काउंटर टिकट बुकिंग मोबाइल से जुड़ी नहीं होती। इसके बजाय टिकट नंबर, UTS रिकॉर्ड और नई तस्वीर जाँची गई।")}</span></p></div>}
                  <div className="surrender-warning"><Icon name="alert" size={20} /><p><b>{tr("This action cannot be undone", "यह कार्रवाई वापस नहीं हो सकती")}</b><span>{tr("After cancellation, the paper ticket cannot be used for travel or another refund.", "रद्द होने के बाद कागज़ी टिकट यात्रा या दूसरे रिफंड के लिए इस्तेमाल नहीं हो सकती।")}</span></p></div>
                  <BottomActions><button className="primary-button" onClick={() => { setSurrenderStage("recorded"); window.scrollTo({ top: 0, behavior: "auto" }); }}>{tr("Cancel ticket digitally", "टिकट ऑनलाइन रद्द करें")}<Icon name="arrow" /></button><button className="secondary-button" onClick={() => { setSurrenderStage("ready"); window.scrollTo({ top: 0, behavior: "auto" }); }}>{tr("Retake demo photo", "डेमो तस्वीर दोबारा लें")}</button></BottomActions>
                </>
              )}
              {surrenderStage === "recorded" && (
                <div className="surrender-success">
                  <div className="success-orbit paid"><span><Icon name="check" size={34} /></span></div>
                  <p className="eyebrow">{ticketData.ticketType === "uts" ? tr("UTS CANCELLATION RECEIPT TW-UTS-824", "UTS रद्दीकरण रसीद TW-UTS-824") : tr("DIGITAL SURRENDER RECEIPT TW-DS-824", "डिजिटल समर्पण रसीद TW-DS-824")}</p>
                  <h1>{tr("Paper ticket cancelled digitally.", "कागज़ी टिकट ऑनलाइन रद्द हो गया।")}</h1>
                  <p className="hero-sub">{ticketData.ticketType === "uts" ? tr("The UTS record now blocks this ticket from travel and another refund.", "UTS रिकॉर्ड अब इस टिकट को यात्रा और दूसरे रिफंड के लिए रोकता है।") : tr("The ticket record now blocks this ticket from travel and another refund.", "टिकट रिकॉर्ड अब इस टिकट को यात्रा और दूसरे रिफंड के लिए रोकता है।")}</p>
                  <div className="surrender-result"><p><Icon name="check" size={16} />{tr("Ticket marked cancelled", "टिकट रद्द दर्ज हुआ")}</p><p><Icon name="check" size={16} />{tr("Paper ticket made unusable", "कागज़ी टिकट उपयोग के लिए अमान्य हुआ")}</p><p><Icon name="check" size={16} />{tr("Digital receipt issued", "डिजिटल रसीद जारी हुई")}</p></div>
                  <BottomActions><button className="primary-button" onClick={() => go("payout")}>{tr("Continue to refund destination", "रिफंड के स्थान पर आगे बढ़ें")}<Icon name="arrow" /></button></BottomActions>
                </div>
              )}
            </div>
          )}

          {screen === "assisted" && (
            <div className="screen">
              {!assistanceCreated ? (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("ASSISTED VERIFICATION", "सहायता से सत्यापन")}</p><h1>{tr("You are not stuck.", "आपकी प्रक्रिया यहाँ नहीं रुकेगी।")}</h1><p>{tr("If the booking number is no longer available, create a help request. Support staff review the original ticket and explain the accepted verification route.", "अगर बुकिंग वाला नंबर अब उपलब्ध नहीं है, तो सहायता अनुरोध बनाएँ। सहायता कर्मचारी मूल टिकट जाँचकर सत्यापन का सही तरीका बताते हैं।")}</p></div>
                  <div className="assist-steps">
                    <div><span>1</span><p><b>{tr("Keep the original ticket", "मूल टिकट पास रखें")}</b><small>{tr("Support would compare it with the booking record.", "सहायता कर्मचारी इसे बुकिंग रिकॉर्ड से मिलाएँगे।")}</small></p></div>
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
                  <BottomActions><button className="primary-button" onClick={() => go("otp")}>{tr("Use the demo code instead", "इसके बजाय डेमो कोड इस्तेमाल करें")}<Icon name="arrow" /></button><button className="secondary-button" onClick={reset}>{tr("Return to home", "मुख्य पृष्ठ पर जाएँ")}</button></BottomActions>
                </div>
              )}
            </div>
          )}

          {screen === "payout" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("CASH-PAID TICKET", "नकद भुगतान टिकट")}</p><h1>{tr(`Where should ₹${ticketData.fare.toLocaleString("en-IN")} go?`, `₹${ticketData.fare.toLocaleString("en-IN")} कहाँ भेजें?`)}</h1><p>{tr("A new destination is needed because this ticket was paid in cash.", "नया खाता इसलिए ज़रूरी है क्योंकि इस टिकट का भुगतान नकद हुआ था।")}</p></div>
              <div className="original-payment"><Icon name="wallet" size={19} /><span><small>{tr("ORIGINAL PAYMENT FOUND", "मूल भुगतान मिला")}</small><b>{ticketData.ticketType === "uts" ? tr("Cash at UTS counter", "UTS काउंटर पर नकद") : tr("Cash at PRS counter", "PRS काउंटर पर नकद")}</b></span></div>
              <div className="method-tabs" role="tablist" aria-label={tr("Refund destination", "रिफंड का स्थान")}><button role="tab" aria-selected={payout === "upi"} className={payout === "upi" ? "active" : ""} onClick={() => setPayout("upi")}><Icon name="phone" />UPI</button><button role="tab" aria-selected={payout === "bank"} className={payout === "bank" ? "active" : ""} onClick={() => setPayout("bank")}><Icon name="wallet" />{tr("Bank account", "बैंक खाता")}</button></div>
              {payout === "upi" ? (
                <div className="payout-card selected"><span className="radio-dot" /><div><small>UPI ID</small><b>asha.rail@okaxis</b><p>{tr("Bank-returned name: Asha P.", "बैंक से मिला नाम: आशा P.")}</p></div><span className="verified-badge"><Icon name="check" size={13} /> {tr("NAME FOUND", "नाम मिला")}</span></div>
              ) : (
                <div className="payout-card selected"><span className="radio-dot" /><div><small>{tr("BANK ACCOUNT", "बैंक खाता")}</small><b>{tr("State Bank", "स्टेट बैंक")} · •••• 1842</b><p>{tr("Bank-returned name: Asha P.", "बैंक से मिला नाम: आशा P.")}</p></div><span className="verified-badge"><Icon name="check" size={13} /> {tr("NAME FOUND", "नाम मिला")}</span></div>
              )}
              <div className="recipient-check"><Icon name="shield" /><div><b>{tr("Destination and claimant checked separately", "खाता और दावेदार अलग-अलग जाँचे गए")}</b><p>{ticketData.ticketType === "uts" ? tr("The bank name check confirmed the destination. The UTS number and one-time ticket photo confirmed current possession—no booking mobile was used.", "बैंक नाम जाँच से खाते की पुष्टि हुई। UTS नंबर और टिकट की नई तस्वीर से मौजूदा कब्ज़े की पुष्टि हुई—बुकिंग मोबाइल इस्तेमाल नहीं हुआ।") : tr("The bank name check confirmed the destination. The booking code and one-time ticket photo confirmed the claimant.", "बैंक नाम जाँच से खाते की पुष्टि हुई। बुकिंग कोड और टिकट की नई तस्वीर से दावेदार की पुष्टि हुई।")}</p></div></div>
              <div className="privacy-note"><Icon name="lock" size={18} /><span>{tr("Only masked payment details are shown.", "केवल छिपी हुई भुगतान जानकारी दिखाई जाती है।")}</span></div>
              <BottomActions><button className="primary-button" onClick={() => go("review")}>{tr("Review refund", "रिफंड की जाँच करें")}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "review" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("FINAL REVIEW", "अंतिम जाँच")}</p><h1>{tr("Ready to start the refund.", "रिफंड शुरू करने के लिए तैयार।")}</h1><p>{tr("Nothing is paid until this final confirmation. Review the facts and consent below.", "अंतिम पुष्टि से पहले कोई भुगतान नहीं होगा। नीचे जानकारी और सहमति जाँचें।")}</p></div>
              <div className="refund-total"><span><small>{ticketData.ticketType === "uts" ? tr("REFUND AMOUNT", "रिफंड राशि") : tr("FULL REFUND", "पूरा रिफंड")}</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b></span><span className="no-fee">₹0 {tr("fee", "शुल्क")}</span></div>
              <div className="review-list"><div><span>{ticketData.ticketType === "uts" ? tr("UTS number", "UTS नंबर") : tr("Ticket", "टिकट")}</span><b>{ticketData.ticketType === "uts" ? ticketData.identifier : `PNR ${ticketData.identifier}`}</b></div><div><span>{tr("Journey", "यात्रा")}</span><b>{ticketData.origin} → {ticketData.destination}</b></div><div><span>{tr("Journey date", "यात्रा की तारीख")}</span><b>{formatJourneyDate(ticketData.date, lang)}</b></div><div><span>{tr("Cancellation", "रद्दीकरण")}</span><b className="green-text"><Icon name="check" size={14} /> {ticketData.ticketType === "uts" ? tr("Special cancellation found", "विशेष रद्दीकरण मिला") : tr("Cancellation found", "रद्दीकरण मिला")}</b></div><div><span>{tr("Ownership", "मालिकाना")}</span><b className="green-text"><Icon name="check" size={14} /> {ticketData.ticketType === "uts" ? tr("Original ticket possession confirmed", "मूल टिकट का कब्ज़ा पुष्ट") : tr("Booking mobile confirmed", "बुकिंग मोबाइल की पुष्टि हुई")}</b></div><div><span>{tr("Paper ticket", "कागज़ी टिकट")}</span><b className="green-text"><Icon name="check" size={14} /> {tr("Digitally surrendered", "डिजिटल रूप से समर्पित")}</b></div><div><span>{tr("Refund account", "रिफंड खाता")}</span><b>{payout === "upi" ? "asha.rail@okaxis" : "SBI · •••• 1842"}</b></div></div>
              <button className="edit-link" onClick={() => go("details")}><Icon name="back" size={16} /> {tr("Edit ticket details", "टिकट की जानकारी बदलें")}</button>
              <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><b>{tr("I confirm these details are correct.", "मैं पुष्टि करता/करती हूँ कि यह जानकारी सही है।")}</b><small>{tr("I agree to use these details to create one refund request for this journey.", "मैं इस यात्रा के लिए एक रिफंड अनुरोध बनाने में इस जानकारी के उपयोग से सहमत हूँ।")}</small></span></label>
              <div className="lock-preview"><Icon name="lock" /><div><b>{tr("We check for an existing refund first", "हम पहले पुराने रिफंड की जाँच करते हैं")}</b><p>{tr("This prevents the same ticket from being refunded twice, even if the button is tapped again.", "बटन दोबारा दबने पर भी इससे एक ही टिकट का दो बार रिफंड नहीं होता।")}</p></div></div>
              <BottomActions><button className="primary-button" disabled={!consent} onClick={startRefund}>{tr(`Confirm and send ₹${ticketData.fare.toLocaleString("en-IN")} refund`, `पुष्टि करके ₹${ticketData.fare.toLocaleString("en-IN")} रिफंड भेजें`)}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "tracking" && (
            <div className="screen tracking-screen">
              <div className={`success-orbit ${paid ? "paid" : ""}`}><span><Icon name="check" size={34} /></span></div>
              <p className="eyebrow">{ticketData.ticketType === "uts" ? tr("CLAIM TW-UTS-613", "दावा TW-UTS-613") : tr("CLAIM TW-824-613", "दावा TW-824-613")}</p>
              <h1>{paid ? tr(`₹${ticketData.fare.toLocaleString("en-IN")} has been paid.`, `₹${ticketData.fare.toLocaleString("en-IN")} का भुगतान हो गया।`) : tr("Your refund is being sent.", "आपका रिफंड भेजा जा रहा है।")}</h1>
              <p className="hero-sub">{paid ? tr("Sent to your selected refund account. Keep this reference for your records.", "चुने हुए रिफंड खाते में भेज दिया गया है। यह संदर्भ सुरक्षित रखें।") : tr("Your request is confirmed. This page will update when the transfer is complete.", "आपके अनुरोध की पुष्टि हो गई है। ट्रांसफर पूरा होने पर यह पेज अपडेट होगा।")}</p>
              <div className="tracking-amount"><small>{tr("REFUND AMOUNT", "रिफंड राशि")}</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b><span className={paid ? "paid-state" : "pending-state"}>{paid ? tr("PAID", "भुगतान हुआ") : tr("PROCESSING", "प्रक्रिया में")}</span></div>
              <div className="timeline">
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{tr("Refund request created", "रिफंड अनुरोध बना")}</b><small>{tr("24 Aug · 10:41:08", "24 अगस्त · 10:41:08")}</small></span></div>
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{ticketData.ticketType === "uts" ? tr("UTS special cancellation confirmed", "UTS विशेष रद्दीकरण पुष्ट") : tr("Cancellation confirmed", "रद्दीकरण की पुष्टि हुई")}</b><small>{tr("24 Aug · 10:41:09", "24 अगस्त · 10:41:09")}</small></span></div>
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{tr("Paper ticket cancelled digitally", "कागज़ी टिकट ऑनलाइन रद्द हुआ")}</b><small>{ticketData.ticketType === "uts" ? tr("Receipt TW-UTS-824", "रसीद TW-UTS-824") : tr("Receipt TW-DS-824", "रसीद TW-DS-824")}</small></span></div>
                <div className={paid ? "complete" : "current"}><i>{paid ? <Icon name="check" size={13} /> : <span />}</i><span><b>{paid ? tr("Paid to selected account", "चुने खाते में भुगतान हुआ") : tr("Refund transfer in progress", "रिफंड ट्रांसफर जारी है")}</b><small>{paid ? tr("Payment reference 4268•••914", "भुगतान संदर्भ 4268•••914") : tr("This page updates automatically", "यह पेज अपने-आप अपडेट होगा")}</small></span></div>
              </div>
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
