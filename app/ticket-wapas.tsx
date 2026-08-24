"use client";

import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";

type Screen =
  | "home"
  | "capture"
  | "details"
  | "eligibility"
  | "otp"
  | "assisted"
  | "payout"
  | "review"
  | "tracking";

type Lang = "en" | "hi";
type Payout = "upi" | "bank";
type ConfidenceStatus = "extracted" | "unclear" | "missing";
type RequiredTicketField = "pnr" | "trainNumber" | "date" | "origin" | "destination" | "fare";
type AnalysisState = "idle" | "reading" | "done" | "fallback" | "rejected";

type TicketData = {
  pnr: string;
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
  documentType?: "prs_counter_ticket" | "not_ticket" | "unclear";
  documentConfidence?: "high" | "medium" | "low";
  documentNotes?: string;
  pnr?: string | null;
  trainNumber?: string | null;
  trainName?: string | null;
  date?: string | null;
  origin?: string | null;
  destination?: string | null;
  passengers?: number | null;
  fare?: number | null;
  mobile?: string | null;
  confidence?: Partial<Record<RequiredTicketField, ConfidenceStatus>>;
};

const ticket: TicketData = {
  pnr: "2468135790",
  trainNumber: "12424",
  trainName: "Rajdhani Express",
  date: "2026-08-24",
  origin: "New Delhi",
  destination: "Dibrugarh",
  passengers: 2,
  fare: 4860,
  mobile: "+91 •••••• 2714",
  confidence: {
    pnr: "extracted",
    trainNumber: "extracted",
    date: "extracted",
    origin: "extracted",
    destination: "extracted",
    fare: "extracted",
  },
};

const emptyTicket: TicketData = {
  pnr: "",
  trainNumber: "",
  trainName: "",
  date: "",
  origin: "",
  destination: "",
  passengers: 0,
  fare: 0,
  mobile: null,
  confidence: {
    pnr: "missing",
    trainNumber: "missing",
    date: "missing",
    origin: "missing",
    destination: "missing",
    fare: "missing",
  },
};

const screens: Screen[] = ["home", "capture", "details", "eligibility", "otp", "payout", "review", "tracking"];

const dictionary = {
  en: {
    strap: "COUNTER-TICKET REFUNDS, WITHOUT THE RETURN TRIP",
    hero: "The train was cancelled. Your refund journey should be too.",
    sub: "Check a cancelled counter ticket, confirm it belongs to you, and receive the refund digitally — without going back to the railway counter.",
    start: "Check my refund",
    manual: "Enter ticket manually",
    proof: "Ownership checked before refund",
    demo: "Prototype — synthetic data only",
    back: "Back",
    continue: "Continue",
  },
  hi: {
    strap: "काउंटर टिकट रिफंड, बिना स्टेशन लौटे",
    hero: "ट्रेन रद्द हुई है। रिफंड के लिए सफ़र क्यों?",
    sub: "रद्द हुई काउंटर टिकट को जाँचें, मालिकाना साबित करें और रिफंड डिजिटल रूप से पाएँ — रेलवे काउंटर पर लौटे बिना।",
    start: "अपना रिफंड जाँचें",
    manual: "टिकट की जानकारी भरें",
    proof: "भुगतान से पहले सत्यापन",
    demo: "प्रोटोटाइप — केवल नकली डेटा",
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

function TicketStub({ faded = false }: { faded?: boolean }) {
  return (
    <div className={`ticket-stub ${faded ? "faded" : ""}`} aria-label="Synthetic railway counter ticket">
      <div className="ticket-notch notch-a" /><div className="ticket-notch notch-b" />
      <div className="ticket-mini-head"><span>JOURNEY TICKET</span><b>PRS</b></div>
      <div className="ticket-pnr"><small>PNR</small><strong>2468135790</strong></div>
      <div className="ticket-route"><b>NDLS</b><span><i /><i /><i /></span><b>DBRT</b></div>
      <div className="ticket-grid"><span>12424</span><span>24 AUG 26</span><span>2 ADULTS</span></div>
      <div className="ticket-bottom"><span>₹4,860</span><span>DEMO / NOT VALID</span></div>
    </div>
  );
}

function StatusPill({ status, lang }: { status: "extracted" | "unclear" | "missing"; lang: Lang }) {
  const label = lang === "hi"
    ? status === "extracted" ? "मिल गया" : status === "unclear" ? "इसे जाँचें" : "ज़रूरी"
    : status === "extracted" ? "FOUND" : status === "unclear" ? "CHECK THIS" : "NEEDED";
  return <span className={`status-pill ${status}`}>{status === "extracted" && <Icon name="check" size={12} />}{label}</span>;
}

function Field({ label, value, lang, status = "extracted", onChange, type = "text", inputMode, maxLength, placeholder, hint, error }: {
  label: string;
  value: string;
  lang: Lang;
  status?: ConfidenceStatus;
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
      <span className="field-label">{label}<StatusPill status={status} lang={lang} /></span>
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
  const values = {
    pnr: text(raw.pnr),
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
    pnr: values.pnr.length > 0,
    trainNumber: values.trainNumber.length > 0,
    date: values.date.length > 0,
    origin: values.origin.length > 0,
    destination: values.destination.length > 0,
    fare: values.fare > 0,
  };
  const confidence = Object.fromEntries(
    (Object.keys(hasValue) as RequiredTicketField[]).map((key) => [
      key,
      hasValue[key] ? (raw.confidence?.[key] ?? "extracted") : "missing",
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
  const [payout, setPayout] = useState<Payout>("upi");
  const [consent, setConsent] = useState(true);
  const [paid, setPaid] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [assistanceMobile, setAssistanceMobile] = useState("");
  const [assistanceCreated, setAssistanceCreated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const c = dictionary[lang];
  const tr = (english: string, hindi: string) => lang === "hi" ? hindi : english;
  const screenIndex = screen === "assisted" ? screens.indexOf("otp") : screens.indexOf(screen);

  const effectiveConfidence = ticketData.confidence;
  const confidentFieldCount = Object.values(effectiveConfidence).filter((status) => status === "extracted").length;
  const effectiveTrainNumber = ticketData.trainNumber;
  const fieldErrors: Partial<Record<RequiredTicketField, string>> = {
    ...(!/^\d{10}$/.test(ticketData.pnr) ? { pnr: tr("Enter the 10-digit PNR printed on the ticket.", "टिकट पर छपा 10 अंकों का PNR भरें।") } : {}),
    ...(!/^\d{5}$/.test(effectiveTrainNumber) ? { trainNumber: tr("Enter the 5-digit train number.", "5 अंकों का ट्रेन नंबर भरें।") } : {}),
    ...(!isValidJourneyDate(ticketData.date) ? { date: tr("Choose the journey date in DD/MM/YYYY format.", "यात्रा की तारीख DD/MM/YYYY में चुनें।") } : {}),
    ...(ticketData.origin.trim().length < 2 ? { origin: tr("Enter the boarding station name or code.", "चढ़ने वाले स्टेशन का नाम या कोड भरें।") } : {}),
    ...(ticketData.destination.trim().length < 2 ? { destination: tr("Enter the destination station name or code.", "गंतव्य स्टेशन का नाम या कोड भरें।") } : {}),
    ...(!(ticketData.fare > 0) ? { fare: tr("Enter the fare printed on the ticket.", "टिकट पर छपा किराया भरें।") } : {}),
  };
  const requiredFieldsReady =
    /^\d{10}$/.test(ticketData.pnr) &&
    /^\d{5}$/.test(effectiveTrainNumber) &&
    isValidJourneyDate(ticketData.date) &&
    ticketData.origin.trim().length >= 2 &&
    ticketData.destination.trim().length >= 2 &&
    ticketData.fare > 0 &&
    Object.values(effectiveConfidence).every((status) => status === "extracted");
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
    setPayout("upi");
    setConsent(true);
    setPaid(false);
    setRetrying(false);
    setAssistanceMobile("");
    setAssistanceCreated(false);
  }

  function go(next: Screen) {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (screen === "assisted") {
      go("otp");
      return;
    }
    const index = Math.max(0, screenIndex - 1);
    go(screens[index]);
  }

  function runSample() {
    setAnalysis("reading");
    setCaptureMessage("");
    setTicketConfirmed(false);
    setTicketData(ticket);
    window.setTimeout(() => {
      setAnalysis("done");
      go("details");
    }, 850);
  }

  function startManualEntry() {
    setTicketData(emptyTicket);
    setTicketConfirmed(false);
    setCaptureMessage("");
    go("details");
  }

  function updateTicketField(field: RequiredTicketField, value: string) {
    const cleaned = field === "pnr"
      ? value.replace(/\D/g, "").slice(0, 10)
      : field === "trainNumber"
        ? value.replace(/\D/g, "").slice(0, 5)
        : value.trimStart();
    const numericFare = field === "fare" ? Number(cleaned.replace(/[^0-9.]/g, "")) : 0;
    const isValid = field === "pnr"
      ? /^\d{10}$/.test(cleaned)
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
      if (data.ticket?.documentType !== "prs_counter_ticket") {
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
        <span>PUBLIC SERVICE PROTOTYPE · जन सेवा प्रोटोटाइप</span>
        <b>{tr("Independent project — not a government website", "स्वतंत्र परियोजना — सरकारी वेबसाइट नहीं")}</b>
      </div>
      <header className="topbar">
        <button className="brand-button" onClick={() => reset()} aria-label="Ticket Wapas home">
          <BrandMark />
          <span className="brand-copy"><b>TICKET WAPAS</b><small>टिकट वापस · CITIZEN REFUND SERVICE</small></span>
        </button>
        <div className="header-actions">
          <div className="language-toggle" role="group" aria-label="Choose language">
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हिं</button>
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="story-panel">
          <p className="eyebrow">{tr("SERVICE OVERVIEW · सेवा की जानकारी", "सेवा की जानकारी · SERVICE OVERVIEW")}</p>
          <h2>{tr("Cancelled counter-ticket refund support, in one guided journey.", "रद्द हुई काउंटर टिकट के रिफंड के लिए एक आसान, निर्देशित प्रक्रिया।")}</h2>
          <p className="story-lead">{tr("E-tickets can be refunded automatically. Passengers with a physical counter ticket may still have to return to a railway counter.", "ई-टिकट का रिफंड अपने-आप हो सकता है। भौतिक काउंटर टिकट वाले यात्रियों को अब भी रेलवे काउंटर पर लौटना पड़ सकता है।")}</p>
          <div className="evidence-card">
            <span className="evidence-number">7.18 cr</span>
            <p>{tr("counter tickets were booked from June 2025 to June 2026 — 11% of all reserved tickets.", "जून 2025 से जून 2026 तक काउंटर टिकट बुक हुईं — सभी आरक्षित टिकटों का 11%।")}</p>
            <a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287719&lang=1&reg=48" target="_blank" rel="noreferrer">{tr("Ministry of Railways ↗", "रेल मंत्रालय ↗")}</a>
          </div>
          <div className="promise-list">
            <div><span><Icon name="shield" /></span><p><b>{tr("A clear decision", "स्पष्ट निर्णय")}</b>{tr("See what was checked and why the ticket qualifies.", "देखें कि क्या जाँचा गया और टिकट रिफंड के योग्य क्यों है।")}</p></div>
            <div><span><Icon name="lock" /></span><p><b>{tr("Protected from duplicate refunds", "दोबारा रिफंड से सुरक्षा")}</b>{tr("We check whether a refund already exists before starting another.", "नया रिफंड शुरू करने से पहले पुराने रिफंड की जाँच होती है।")}</p></div>
            <div><span><Icon name="route" /></span><p><b>{tr("Help when details are unclear", "जानकारी साफ़ न हो तो मदद")}</b>{tr("Correct any field or enter the ticket manually.", "गलत जानकारी सुधारें या टिकट की जानकारी खुद भरें।")}</p></div>
          </div>
          <div className="state-strip" aria-label="Refund state model">
            <span>{tr("ADD TICKET", "टिकट जोड़ें")}</span><i /> <span>{tr("CHECK", "जाँच")}</span><i /> <span>{tr("CONFIRM", "पुष्टि")}</span><i /> <span>{tr("REFUND", "रिफंड")}</span>
          </div>
        </aside>

        <section className="app-frame" aria-live="polite">
          <div className="prototype-ribbon"><Icon name="info" size={14} /> {tr("Independent prototype · Synthetic data only · No real refund", "स्वतंत्र प्रोटोटाइप · केवल नकली डेटा · असली रिफंड नहीं")}</div>
          {screen !== "home" && (
            <div className="progress-wrap">
              <button className="back-button" onClick={back}><Icon name="back" size={18} />{c.back}</button>
              <div className="progress-info"><span>{tr(`STEP ${screenIndex} OF 7`, `चरण ${screenIndex} / 7`)}</span><b>{Math.round((screenIndex / 7) * 100)}%</b></div>
              <div className="progress-track"><span style={{ width: `${(screenIndex / 7) * 100}%` }} /></div>
            </div>
          )}

          {screen === "home" && (
            <div className="screen home-screen">
              <div className="service-facts" aria-label="Service information">
                <span><small>{tr("SERVICE FOR", "सेवा")}</small><b>{tr("Cancelled physical counter tickets", "रद्द हुई भौतिक काउंटर टिकट")}</b></span>
                <span><small>{tr("ACCESS", "पहुँच")}</small><b>{tr("No login required", "लॉगिन की ज़रूरत नहीं")}</b></span>
                <span><small>{tr("STATUS", "स्थिति")}</small><b>{tr("Prototype using mock systems", "नकली सिस्टम वाला प्रोटोटाइप")}</b></span>
              </div>
              <div className="home-visual" aria-hidden="true">
                <TicketStub />
                <div className="refund-path"><span /><i /><i /><b><Icon name="check" size={22} /></b></div>
                <div className="refund-card"><small>{tr("REFUND READY", "रिफंड तैयार")}</small><strong>₹4,860</strong><span>{tr("Verified digitally", "डिजिटल सत्यापन हुआ")}</span></div>
              </div>
              <p className="eyebrow orange">{c.strap}</p>
              <h1>{c.hero}</h1>
              <p className="hero-sub">{c.sub}</p>
              <div className="trust-line"><span><Icon name="shield" size={16} />{c.proof}</span><span><Icon name="lock" size={16} />{tr("Protected from duplicate refunds", "दोबारा रिफंड से सुरक्षा")}</span></div>
              <div className="before-start" aria-label={tr("Before you begin", "शुरू करने से पहले")}>
                <b>{tr("Before you begin", "शुरू करने से पहले")}</b>
                <div><span><Icon name="phone" size={17} />{tr("About 2 minutes", "लगभग 2 मिनट")}</span><span><Icon name="ticket" size={17} />{tr("Keep the ticket and booking phone ready", "टिकट और बुकिंग वाला फ़ोन पास रखें")}</span><span><Icon name="lock" size={17} />{tr("No account needed", "खाता ज़रूरी नहीं")}</span></div>
              </div>
              <BottomActions>
                <button className="primary-button" onClick={() => go("capture")}>{c.start}<Icon name="arrow" /></button>
                <button className="text-button" onClick={startManualEntry}>{c.manual}<Icon name="arrow" size={17} /></button>
              </BottomActions>
              <p className="disclaimer">{tr("Independent civic-tech concept. Not affiliated with or operated by Indian Railways or IRCTC.", "स्वतंत्र नागरिक-तकनीक अवधारणा। भारतीय रेल या IRCTC से संबद्ध या उनके द्वारा संचालित नहीं।")}</p>
            </div>
          )}

          {screen === "capture" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("ADD A SYNTHETIC TICKET", "नकली टिकट जोड़ें")}</p><h1>{tr("Let’s read the journey details.", "यात्रा की जानकारी पढ़ें।")}</h1><p>{tr("Use a clear photo of the full physical counter ticket. For this prototype, do not upload a real passenger ticket.", "पूरी भौतिक काउंटर टिकट की साफ़ तस्वीर लें। इस प्रोटोटाइप में असली यात्री टिकट अपलोड न करें।")}</p></div>
              <div className="safety-banner"><Icon name="shield" size={19} /><span><b>{tr("Synthetic tickets only", "केवल नकली टिकट")}</b>{tr("This demo sends the image for one-time reading, does not store it, and never contacts a government system.", "यह डेमो तस्वीर को केवल एक बार पढ़ता है, उसे सहेजता नहीं और किसी सरकारी सिस्टम से संपर्क नहीं करता।")}</span></div>
              <input ref={fileRef} className="file-input-hidden" tabIndex={-1} aria-hidden="true" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
              <button className="upload-zone" onClick={() => fileRef.current?.click()} disabled={analysis === "reading"} aria-busy={analysis === "reading"}>
                <span className="upload-icon"><Icon name={analysis === "reading" ? "sparkle" : "camera"} size={28} /></span>
                <strong>{analysis === "reading" ? tr("Reading ticket…", "टिकट पढ़ी जा रही है…") : tr("Take photo or upload", "तस्वीर लें या अपलोड करें")}</strong>
                <small>{tr("JPG, PNG or WEBP · up to 5 MB · compressed on your device", "JPG, PNG या WEBP · अधिकतम 5 MB · आपके फ़ोन पर आकार कम होगा")}</small>
                {analysis === "reading" && <span className="scan-line" />}
              </button>
              {(analysis === "fallback" || analysis === "rejected") && (
                <div className={`capture-error ${analysis}`} role="alert">
                  <span><Icon name={analysis === "rejected" ? "alert" : "info"} size={24} /></span>
                  <div><b>{analysis === "rejected" ? tr("This does not look like a counter ticket.", "यह काउंटर टिकट नहीं लगती।") : tr("We could not read the ticket.", "टिकट पढ़ी नहीं जा सकी।")}</b><p>{captureMessage}</p></div>
                  <button onClick={() => fileRef.current?.click()}>{tr("Try another image", "दूसरी तस्वीर आज़माएँ")}</button>
                  <button onClick={startManualEntry}>{tr("Enter details manually", "जानकारी खुद भरें")}</button>
                </div>
              )}
              <div className="or-divider"><span>{tr("or try the sample ticket", "या नमूना टिकट आज़माएँ")}</span></div>
              <div className="sample-row"><TicketStub faded /><div><span className="sample-badge">{tr("SYNTHETIC", "नकली")}</span><b>Rajdhani · NDLS → DBRT</b><small>PNR 2468135790</small></div></div>
              <BottomActions>
                <button className="primary-button" onClick={runSample} disabled={analysis === "reading"}>{analysis === "reading" ? tr("Extracting fields…", "जानकारी पढ़ी जा रही है…") : tr("Use sample ticket", "नमूना टिकट इस्तेमाल करें")}<Icon name="arrow" /></button>
                <button className="text-button" onClick={startManualEntry}>{tr("Enter details instead", "इसके बजाय जानकारी खुद भरें")}</button>
              </BottomActions>
            </div>
          )}

          {screen === "details" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("CHECK AND CORRECT", "जाँचें और सुधारें")}</p><h1>{confidentFieldCount === 0 ? tr("Enter your ticket details.", "टिकट की जानकारी भरें।") : tr("Check every detail before continuing.", "आगे बढ़ने से पहले हर जानकारी जाँचें।")}</h1><p>{tr("The ticket reader can make mistakes. Compare these values with the printed ticket and edit anything that is wrong.", "टिकट रीडर से गलती हो सकती है। छपी टिकट से जानकारी मिलाएँ और जो गलत हो उसे सुधारें।")}</p></div>
              <div className="reader-summary"><span className="reader-icon"><Icon name="sparkle" /></span><div><b>{confidentFieldCount === 6 ? tr("All 6 required details were found", "सभी 6 ज़रूरी जानकारियाँ मिल गईं") : tr(`${confidentFieldCount} of 6 required details were found`, `6 में से ${confidentFieldCount} ज़रूरी जानकारियाँ मिलीं`)}</b><p>{tr("Every field is editable, and you stay in control.", "हर जानकारी बदली जा सकती है और नियंत्रण आपके पास है।")}</p></div></div>
              <div className="field-grid">
                <Field lang={lang} label="PNR" value={ticketData.pnr} status={effectiveConfidence.pnr} inputMode="numeric" maxLength={10} placeholder={tr("10-digit PNR", "10 अंकों का PNR")} error={fieldErrors.pnr} onChange={(value) => updateTicketField("pnr", value)} />
                <Field lang={lang} label={tr("TRAIN NUMBER", "ट्रेन नंबर")} value={effectiveTrainNumber} status={effectiveConfidence.trainNumber} inputMode="numeric" maxLength={5} placeholder={tr("5-digit train number", "5 अंकों का ट्रेन नंबर")} error={fieldErrors.trainNumber} onChange={(value) => updateTicketField("trainNumber", value)} />
                <Field lang={lang} label={tr("JOURNEY DATE", "यात्रा की तारीख")} value={ticketData.date} status={effectiveConfidence.date} type="date" error={fieldErrors.date} hint="DD/MM/YYYY" onChange={(value) => updateTicketField("date", value)} />
                <Field lang={lang} label={tr("FROM STATION", "किस स्टेशन से")} value={ticketData.origin} status={effectiveConfidence.origin} placeholder={tr("e.g. New Delhi or NDLS", "जैसे नई दिल्ली या NDLS")} error={fieldErrors.origin} onChange={(value) => updateTicketField("origin", value)} />
                <Field lang={lang} label={tr("TO STATION", "किस स्टेशन तक")} value={ticketData.destination} status={effectiveConfidence.destination} placeholder={tr("e.g. Dibrugarh or DBRT", "जैसे डिब्रूगढ़ या DBRT")} error={fieldErrors.destination} onChange={(value) => updateTicketField("destination", value)} />
                <Field lang={lang} label={tr("TICKET FARE (₹)", "टिकट का किराया (₹)")} value={ticketData.fare > 0 ? String(ticketData.fare) : ""} status={effectiveConfidence.fare} type="number" inputMode="decimal" placeholder={tr("Fare paid", "दिया गया किराया")} error={fieldErrors.fare} onChange={(value) => updateTicketField("fare", value)} />
                <Field lang={lang} label={tr("TRAIN NAME (OPTIONAL)", "ट्रेन का नाम (वैकल्पिक)")} value={ticketData.trainName} status={ticketData.trainName ? "extracted" : "missing"} placeholder={tr("As printed on ticket", "जैसा टिकट पर छपा है")} hint={tr("Optional", "वैकल्पिक")} onChange={(value) => updateOptionalTicketField("trainName", value)} />
                <Field lang={lang} label={tr("PASSENGERS (OPTIONAL)", "यात्री (वैकल्पिक)")} value={ticketData.passengers > 0 ? String(ticketData.passengers) : ""} status={ticketData.passengers > 0 ? "extracted" : "missing"} type="number" inputMode="numeric" placeholder={tr("Number of passengers", "यात्रियों की संख्या")} hint={tr("Optional", "वैकल्पिक")} onChange={(value) => updateOptionalTicketField("passengers", value)} />
              </div>
              {!requiredFieldsReady && <div className="inline-notice"><Icon name="alert" /><p><b>{tr("Complete the marked fields to continue.", "आगे बढ़ने के लिए चिन्हित जानकारी पूरी करें।")}</b>{tr("Use the exact PNR, five-digit train number and journey details printed on the ticket.", "टिकट पर छपे सही PNR, पाँच अंकों के ट्रेन नंबर और यात्रा की जानकारी भरें।")}</p></div>}
              <label className="confirmation-check"><input type="checkbox" checked={ticketConfirmed} disabled={!requiredFieldsReady} onChange={(event) => setTicketConfirmed(event.target.checked)} /><span><b>{tr("I checked the PNR, train number and journey date.", "मैंने PNR, ट्रेन नंबर और यात्रा की तारीख जाँच ली है।")}</b><small>{requiredFieldsReady ? tr("These three values match the printed ticket.", "ये तीनों जानकारियाँ छपी टिकट से मेल खाती हैं।") : tr("Complete the marked fields first.", "पहले चिन्हित जानकारी पूरी करें।")}</small></span></label>
              <div className="privacy-note"><Icon name="lock" size={18} /><span><b>{tr("Your ticket image is not stored.", "आपकी टिकट की तस्वीर सहेजी नहीं जाती।")}</b> {tr("Only confirmed fields move to the eligibility check.", "केवल पुष्टि की गई जानकारी योग्यता जाँच में जाती है।")}</span></div>
              <BottomActions><button className="primary-button" onClick={() => go("eligibility")} disabled={!requiredFieldsReady || !ticketConfirmed}>{tr("Confirm & check cancellation", "पुष्टि करें और रद्द होने की जाँच करें")}<Icon name="arrow" /></button><button className="text-button" onClick={() => go("capture")}>{tr("Use a different ticket image", "दूसरी टिकट की तस्वीर इस्तेमाल करें")}</button></BottomActions>
            </div>
          )}

          {screen === "eligibility" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("ELIGIBILITY CHECK · SIMULATED", "योग्यता जाँच · नकली")}</p><h1>{tr("Full refund is available.", "पूरा रिफंड उपलब्ध है।")}</h1><p>{tr("Your confirmed ticket details match the mocked cancellation record.", "आपकी पुष्टि की गई टिकट जानकारी नकली रद्दीकरण रिकॉर्ड से मेल खाती है।")}</p></div>
              <div className="decision-card eligible"><span className="decision-icon"><Icon name="check" size={30} /></span><div><small>{tr("ELIGIBLE · 3 OF 3 CHECKS PASSED", "योग्य · 3 में से 3 जाँच पूरी")}</small><strong>₹{ticketData.fare.toLocaleString("en-IN")} {tr("full fare", "पूरा किराया")}</strong><p>{tr("No cancellation charge", "कोई रद्दीकरण शुल्क नहीं")} · {ticketData.passengers > 0 ? tr(`${ticketData.passengers} passengers`, `${ticketData.passengers} यात्री`) : tr("passenger count verified by mock record", "नकली रिकॉर्ड से यात्रियों की संख्या सत्यापित")}</p></div></div>
              <div className="rule-list">
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("Train cancellation found", "ट्रेन रद्द होने की जानकारी मिली")}</b><small>{tr("Mock cancellation record · 23 Aug, 18:42", "नकली रद्दीकरण रिकॉर्ड · 23 अगस्त, 18:42")}</small></p></div>
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("Physical counter ticket confirmed", "भौतिक काउंटर टिकट की पुष्टि हुई")}</b><small>{tr("The ticket type is eligible for this journey", "इस यात्रा के लिए टिकट का प्रकार योग्य है")}</small></p></div>
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>{tr("No earlier refund found", "पहले का कोई रिफंड नहीं मिला")}</b><small>{tr("This ticket can continue", "यह टिकट आगे बढ़ सकती है")}</small></p></div>
              </div>
              <div className="plain-language"><b>{tr("Why this decision?", "यह निर्णय क्यों?")}</b><p>{tr("The result uses the details you confirmed and a mocked cancellation record. The ticket reader does not approve or calculate the refund.", "यह परिणाम आपकी पुष्टि की गई जानकारी और नकली रद्दीकरण रिकॉर्ड पर आधारित है। टिकट रीडर रिफंड को मंज़ूर या उसकी गणना नहीं करता।")}</p></div>
              <BottomActions><button className="primary-button" onClick={() => go("otp")}>{tr("Verify ticket ownership", "टिकट का मालिकाना सत्यापित करें")}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "otp" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("PROVE OWNERSHIP", "मालिकाना साबित करें")}</p><h1>{tr("Check the booking mobile.", "बुकिंग वाला फ़ोन जाँचें।")}</h1><p>{tr("A 6-digit code was sent to", "6 अंकों का कोड भेजा गया है")} <b>+91 •••••• 2714</b>{tr(", the number captured when this ticket was booked.", " पर, जो टिकट बुक करते समय दिया गया था।")}</p></div>
              <div className="otp-row" aria-label="One-time password">
                {otp.map((digit, index) => <input key={index} inputMode="numeric" maxLength={1} value={digit} aria-label={tr(`OTP digit ${index + 1}`, `OTP अंक ${index + 1}`)} onChange={(event) => { const copy = [...otp]; copy[index] = event.target.value.replace(/\D/g, ""); setOtp(copy); }} />)}
              </div>
              <div className="demo-code"><span><Icon name="sparkle" size={16} /> {tr("DEMO CODE", "डेमो कोड")}</span><b>271406</b><button onClick={() => setOtp(["2", "7", "1", "4", "0", "6"])}>{tr("Fill code", "कोड भरें")}</button></div>
              <p className="attempt-note"><Icon name="shield" size={16} /> {tr("3 attempts maximum · code expires in 10 minutes", "अधिकतम 3 कोशिशें · कोड 10 मिनट में समाप्त होगा")}</p>
              <button className="phone-help" onClick={() => go("assisted")}><Icon name="phone" size={19} /><span><b>{tr("I no longer have access to this number", "अब यह नंबर मेरे पास नहीं है")}</b><small>{tr("Get an assisted verification reference", "सहायता से सत्यापन का संदर्भ पाएँ")}</small></span><Icon name="arrow" size={18} /></button>
              <BottomActions><button className="primary-button" disabled={otp.join("") !== "271406"} onClick={() => go("payout")}>{tr("Verify code", "कोड सत्यापित करें")}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "assisted" && (
            <div className="screen">
              {!assistanceCreated ? (
                <>
                  <div className="screen-heading"><p className="eyebrow">{tr("ASSISTED VERIFICATION · SIMULATED", "सहायता से सत्यापन · नकली")}</p><h1>{tr("You are not stuck.", "आपकी प्रक्रिया यहाँ नहीं रुकेगी।")}</h1><p>{tr("If the booking number is no longer available, create a help request. A real service would review the original ticket and tell you the accepted verification route.", "अगर बुकिंग वाला नंबर अब उपलब्ध नहीं है, तो सहायता अनुरोध बनाएँ। असली सेवा में कर्मचारी मूल टिकट जाँचकर सत्यापन का सही तरीका बताते।")}</p></div>
                  <div className="assist-steps">
                    <div><span>1</span><p><b>{tr("Keep the original ticket", "मूल टिकट पास रखें")}</b><small>{tr("Support would compare it with the booking record.", "सहायता कर्मचारी इसे बुकिंग रिकॉर्ड से मिलाएँगे।")}</small></p></div>
                    <div><span>2</span><p><b>{tr("Use a reachable mobile", "चालू मोबाइल नंबर दें")}</b><small>{tr("For this prototype, use the sample number below—not a real number.", "इस प्रोटोटाइप में नीचे दिया नमूना नंबर इस्तेमाल करें—असली नंबर नहीं।")}</small></p></div>
                    <div><span>3</span><p><b>{tr("Save the help reference", "सहायता संदर्भ सुरक्षित रखें")}</b><small>{tr("It lets you continue without repeating the ticket details.", "इससे टिकट की जानकारी दोबारा भरे बिना आगे बढ़ सकते हैं।")}</small></p></div>
                  </div>
                  <label className="assist-mobile data-field">
                    <span className="field-label">{tr("REACHABLE MOBILE · SAMPLE ONLY", "चालू मोबाइल · केवल नमूना")}</span>
                    <input aria-label={tr("Reachable sample mobile number", "चालू नमूना मोबाइल नंबर")} inputMode="numeric" maxLength={10} placeholder="98765 43210" value={assistanceMobile} onChange={(event) => setAssistanceMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} />
                    <small className="field-hint">{tr("Do not enter a real phone number in this prototype.", "इस प्रोटोटाइप में असली फ़ोन नंबर न भरें।")}</small>
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
                  <p className="hero-sub">{tr("Keep this reference. In a real service, trained support staff would review the ticket and explain the next accepted verification step.", "यह संदर्भ सुरक्षित रखें। असली सेवा में प्रशिक्षित कर्मचारी टिकट जाँचकर सत्यापन का अगला मान्य तरीका बताएँगे।")}</p>
                  <div className="plain-language"><b>{tr("Prototype boundary", "प्रोटोटाइप की सीमा")}</b><p>{tr("No railway system or support team was contacted, and no real personal information was used.", "किसी रेलवे सिस्टम या सहायता टीम से संपर्क नहीं हुआ और कोई असली व्यक्तिगत जानकारी इस्तेमाल नहीं हुई।")}</p></div>
                  <BottomActions><button className="primary-button" onClick={() => go("otp")}>{tr("Use the demo code instead", "इसके बजाय डेमो कोड इस्तेमाल करें")}<Icon name="arrow" /></button><button className="secondary-button" onClick={reset}>{tr("Return to home", "मुख्य पृष्ठ पर जाएँ")}</button></BottomActions>
                </div>
              )}
            </div>
          )}

          {screen === "payout" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("CHOOSE REFUND ACCOUNT", "रिफंड खाता चुनें")}</p><h1>{tr(`Where should ₹${ticketData.fare.toLocaleString("en-IN")} go?`, `₹${ticketData.fare.toLocaleString("en-IN")} कहाँ भेजें?`)}</h1><p>{tr("Choose where you want to receive the refund. All details below are masked and synthetic.", "रिफंड पाने का तरीका चुनें। नीचे दी गई सभी जानकारियाँ छिपी हुई और नकली हैं।")}</p></div>
              <div className="method-tabs" role="tablist" aria-label={tr("Refund destination", "रिफंड का स्थान")}><button role="tab" aria-selected={payout === "upi"} className={payout === "upi" ? "active" : ""} onClick={() => setPayout("upi")}><Icon name="phone" />UPI</button><button role="tab" aria-selected={payout === "bank"} className={payout === "bank" ? "active" : ""} onClick={() => setPayout("bank")}><Icon name="wallet" />{tr("Bank account", "बैंक खाता")}</button></div>
              {payout === "upi" ? (
                <div className="payout-card selected"><span className="radio-dot" /><div><small>UPI ID</small><b>asha.rail@okaxis</b><p>{tr("Account name: Asha P.", "खाते का नाम: आशा P.")}</p></div><span className="verified-badge"><Icon name="check" size={13} /> {tr("VERIFIED", "सत्यापित")}</span></div>
              ) : (
                <div className="payout-card selected"><span className="radio-dot" /><div><small>{tr("BANK ACCOUNT", "बैंक खाता")}</small><b>{tr("State Bank", "स्टेट बैंक")} · •••• 1842</b><p>{tr("Account name: Asha P.", "खाते का नाम: आशा P.")}</p></div><span className="verified-badge"><Icon name="check" size={13} /> {tr("VERIFIED", "सत्यापित")}</span></div>
              )}
              <div className="recipient-check"><Icon name="shield" /><div><b>{tr("Refund name checked", "रिफंड खाते का नाम जाँचा गया")}</b><p>{tr("The name on the mock refund account matches the booking contact.", "नकली रिफंड खाते का नाम बुकिंग संपर्क से मेल खाता है।")}</p></div></div>
              <div className="privacy-note"><Icon name="lock" size={18} /><span>{tr("Only masked, synthetic payment details are used in this prototype.", "इस प्रोटोटाइप में केवल छिपी हुई, नकली भुगतान जानकारी इस्तेमाल होती है।")}</span></div>
              <BottomActions><button className="primary-button" onClick={() => go("review")}>{tr("Review refund", "रिफंड की जाँच करें")}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "review" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">{tr("FINAL REVIEW", "अंतिम जाँच")}</p><h1>{tr("Ready to start the refund.", "रिफंड शुरू करने के लिए तैयार।")}</h1><p>{tr("Nothing is paid until this final confirmation. Review the facts and consent below.", "अंतिम पुष्टि से पहले कोई भुगतान नहीं होगा। नीचे जानकारी और सहमति जाँचें।")}</p></div>
              <div className="refund-total"><span><small>{tr("FULL REFUND", "पूरा रिफंड")}</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b></span><span className="no-fee">₹0 {tr("fee", "शुल्क")}</span></div>
              <div className="review-list"><div><span>{tr("Ticket", "टिकट")}</span><b>PNR {ticketData.pnr}</b></div><div><span>{tr("Journey", "यात्रा")}</span><b>{ticketData.origin} → {ticketData.destination}</b></div><div><span>{tr("Journey date", "यात्रा की तारीख")}</span><b>{formatJourneyDate(ticketData.date, lang)}</b></div><div><span>{tr("Cancellation", "रद्दीकरण")}</span><b className="green-text"><Icon name="check" size={14} /> {tr("Cancellation found", "रद्दीकरण मिला")}</b></div><div><span>{tr("Ownership", "मालिकाना")}</span><b className="green-text"><Icon name="check" size={14} /> {tr("OTP confirmed", "OTP की पुष्टि हुई")}</b></div><div><span>{tr("Refund account", "रिफंड खाता")}</span><b>{payout === "upi" ? "asha.rail@okaxis" : "SBI · •••• 1842"}</b></div></div>
              <button className="edit-link" onClick={() => go("details")}><Icon name="back" size={16} /> {tr("Edit ticket details", "टिकट की जानकारी बदलें")}</button>
              <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><b>{tr("I confirm these details are correct.", "मैं पुष्टि करता/करती हूँ कि यह जानकारी सही है।")}</b><small>{tr("I agree to use these details to create one refund request for this journey.", "मैं इस यात्रा के लिए एक रिफंड अनुरोध बनाने में इस जानकारी के उपयोग से सहमत हूँ।")}</small></span></label>
              <div className="lock-preview"><Icon name="lock" /><div><b>{tr("We check for an existing refund first", "हम पहले पुराने रिफंड की जाँच करते हैं")}</b><p>{tr("This prevents the same ticket from being refunded twice, even if the button is tapped again.", "बटन दोबारा दबने पर भी इससे एक ही टिकट का दो बार रिफंड नहीं होता।")}</p></div></div>
              <BottomActions><button className="primary-button" disabled={!consent} onClick={() => go("tracking")}>{tr(`Start ₹${ticketData.fare.toLocaleString("en-IN")} refund`, `₹${ticketData.fare.toLocaleString("en-IN")} का रिफंड शुरू करें`)}<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "tracking" && (
            <div className="screen tracking-screen">
              <div className={`success-orbit ${paid ? "paid" : ""}`}><span><Icon name="check" size={34} /></span></div>
              <p className="eyebrow">{tr("CLAIM TW-824-613", "दावा TW-824-613")}</p>
              <h1>{paid ? tr(`₹${ticketData.fare.toLocaleString("en-IN")} has been paid.`, `₹${ticketData.fare.toLocaleString("en-IN")} का भुगतान हो गया।`) : tr("Your refund request is ready.", "आपका रिफंड अनुरोध तैयार है।")}</h1>
              <p className="hero-sub">{paid ? tr("Sent to your selected refund account. Keep this reference for your records.", "चुने हुए रिफंड खाते में भेज दिया गया है। यह संदर्भ सुरक्षित रखें।") : tr("We found no earlier refund for this ticket. You can now complete the mocked payment.", "इस टिकट का कोई पुराना रिफंड नहीं मिला। अब नकली भुगतान पूरा करें।")}</p>
              <div className="tracking-amount"><small>{tr("REFUND AMOUNT", "रिफंड राशि")}</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b><span className={paid ? "paid-state" : "pending-state"}>{paid ? tr("PAID", "भुगतान हुआ") : tr("REFUND PENDING", "रिफंड बाकी")}</span></div>
              <div className="timeline">
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{tr("Refund request created", "रिफंड अनुरोध बना")}</b><small>{tr("24 Aug · 10:41:08", "24 अगस्त · 10:41:08")}</small></span></div>
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>{tr("Mock cancellation confirmed", "नकली रद्दीकरण की पुष्टि हुई")}</b><small>{tr("24 Aug · 10:41:09", "24 अगस्त · 10:41:09")}</small></span></div>
                <div className={paid ? "complete" : "current"}><i>{paid ? <Icon name="check" size={13} /> : <span />}</i><span><b>{paid ? tr("Paid to selected account", "चुने खाते में भुगतान हुआ") : tr("Refund ready to send", "रिफंड भेजने के लिए तैयार")}</b><small>{paid ? tr("Payment reference 4268•••914", "भुगतान संदर्भ 4268•••914") : tr("Complete the mock payment below", "नीचे नकली भुगतान पूरा करें")}</small></span></div>
              </div>
              <BottomActions>
                {!paid && <button className="primary-button" disabled={retrying} onClick={() => { setRetrying(true); window.setTimeout(() => { setPaid(true); setRetrying(false); }, 900); }}>{retrying ? tr("Checking payment status…", "भुगतान की स्थिति जाँची जा रही है…") : tr("Complete mock payment", "नकली भुगतान पूरा करें")}<Icon name="arrow" /></button>}
                <button className="secondary-button" onClick={() => reset()}>{tr("Start another ticket", "दूसरी टिकट शुरू करें")}</button>
              </BottomActions>
            </div>
          )}
        </section>
      </div>

      <footer className="site-footer">
        <b>Ticket Wapas · टिकट वापस</b>
        <span>{tr("Independent civic-tech prototype. Not affiliated with or operated by Indian Railways, IRCTC, or the Government of India.", "स्वतंत्र नागरिक-तकनीक प्रोटोटाइप। भारतीय रेल, IRCTC या भारत सरकार से संबद्ध या उनके द्वारा संचालित नहीं।")}</span>
        <span>{tr("No real tickets, identities, OTPs, payments, or government systems are used.", "कोई असली टिकट, पहचान, OTP, भुगतान या सरकारी सिस्टम इस्तेमाल नहीं होता।")}</span>
      </footer>

    </main>
  );
}
