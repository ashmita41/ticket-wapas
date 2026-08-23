"use client";

import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";

type Screen =
  | "home"
  | "capture"
  | "details"
  | "eligibility"
  | "otp"
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
    sub: "Verify a cancelled counter ticket, prove ownership, and receive the refund digitally — without going back to a PRS counter.",
    start: "Start with a sample ticket",
    manual: "Enter ticket manually",
    proof: "Proof before payout",
    demo: "Prototype — synthetic data only",
    back: "Back",
    continue: "Continue",
  },
  hi: {
    strap: "काउंटर टिकट रिफंड, बिना स्टेशन लौटे",
    hero: "ट्रेन रद्द हुई है। रिफंड के लिए सफ़र क्यों?",
    sub: "रद्द हुई काउंटर टिकट को जाँचें, मालिकाना साबित करें और रिफंड डिजिटल रूप से पाएँ — PRS काउंटर पर लौटे बिना।",
    start: "नमूना टिकट इस्तेमाल करें",
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

function StatusPill({ status }: { status: "extracted" | "unclear" | "missing" }) {
  const label = status === "extracted" ? "EXTRACTED" : status === "unclear" ? "CHECK THIS" : "MISSING";
  return <span className={`status-pill ${status}`}>{status === "extracted" && <Icon name="check" size={12} />}{label}</span>;
}

function Field({ label, value, status = "extracted", onChange, type = "text", inputMode, maxLength, placeholder, hint, error }: {
  label: string;
  value: string;
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
      <span className="field-label">{label}<StatusPill status={status} /></span>
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

function formatJourneyDate(value: string) {
  if (!isValidJourneyDate(value)) return value || "Journey date";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
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
  const fileRef = useRef<HTMLInputElement>(null);
  const c = dictionary[lang];
  const screenIndex = screens.indexOf(screen);

  const effectiveConfidence = ticketData.confidence;
  const confidentFieldCount = Object.values(effectiveConfidence).filter((status) => status === "extracted").length;
  const effectiveTrainNumber = ticketData.trainNumber;
  const fieldErrors: Partial<Record<RequiredTicketField, string>> = {
    ...(!/^\d{10}$/.test(ticketData.pnr) ? { pnr: "Enter the 10-digit PNR printed on the ticket." } : {}),
    ...(!/^\d{5}$/.test(effectiveTrainNumber) ? { trainNumber: "Enter the 5-digit train number." } : {}),
    ...(!isValidJourneyDate(ticketData.date) ? { date: "Choose the journey date in DD/MM/YYYY format." } : {}),
    ...(ticketData.origin.trim().length < 2 ? { origin: "Enter the boarding station name or code." } : {}),
    ...(ticketData.destination.trim().length < 2 ? { destination: "Enter the destination station name or code." } : {}),
    ...(!(ticketData.fare > 0) ? { fare: "Enter the fare printed on the ticket." } : {}),
  };
  const requiredFieldsReady =
    /^\d{10}$/.test(ticketData.pnr) &&
    /^\d{5}$/.test(effectiveTrainNumber) &&
    isValidJourneyDate(ticketData.date) &&
    ticketData.origin.trim().length >= 2 &&
    ticketData.destination.trim().length >= 2 &&
    ticketData.fare > 0 &&
    Object.values(effectiveConfidence).every((status) => status === "extracted");
  const claimKey = `${ticketData.pnr || "PNR"}-${ticketData.date.replace(/[^a-z0-9]/gi, "").toUpperCase() || "DATE"}-FTC`;

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
  }

  function go(next: Screen) {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
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
      setCaptureMessage("Choose a JPG, PNG or WEBP image of a synthetic PRS counter ticket.");
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setAnalysis("fallback");
      setCaptureMessage("The image must be smaller than 5 MB. Try a lower-resolution photo.");
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
          ? "This does not look like a readable PRS counter ticket."
          : "The ticket reader is temporarily unavailable. Try again or enter the details manually."));
        return;
      }
      if (data.ticket?.documentType !== "prs_counter_ticket") {
        setAnalysis("rejected");
        setCaptureMessage("This image does not look like a PRS counter ticket. Upload a clear synthetic counter-ticket image.");
        return;
      }
      setTicketData(normaliseExtractedTicket(data.ticket));
      setAnalysis("done");
      window.setTimeout(() => go("details"), 500);
    } catch {
      setAnalysis("fallback");
      setCaptureMessage("We could not reach the ticket reader. Check your connection, try again or enter the details manually.");
    }
  }

  return (
    <main className="site-shell">
      <div className="service-strip">
        <span>PUBLIC SERVICE PROTOTYPE · जन सेवा प्रोटोटाइप</span>
        <b>Independent project — not a government website</b>
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
          <p className="eyebrow">SERVICE OVERVIEW · सेवा की जानकारी</p>
          <h2>Cancelled counter-ticket refund support, in one guided journey.</h2>
          <p className="story-lead">E-tickets can be refunded automatically. Counter-ticket passengers may still have to return to a PRS counter.</p>
          <div className="evidence-card">
            <span className="evidence-number">7.18 cr</span>
            <p>counter tickets were booked from June 2025 to June 2026 — 11% of all reserved tickets.</p>
            <a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287719&lang=1&reg=48" target="_blank" rel="noreferrer">Ministry of Railways ↗</a>
          </div>
          <div className="promise-list">
            <div><span><Icon name="shield" /></span><p><b>Deterministic eligibility</b>AI reads the ticket. Rules decide the refund.</p></div>
            <div><span><Icon name="lock" /></span><p><b>One ticket, one claim</b>PNR + journey + claim type blocks duplicates.</p></div>
            <div><span><Icon name="route" /></span><p><b>Designed for the exception</b>Manual rescue, assisted verification, safe retry.</p></div>
          </div>
          <div className="state-strip" aria-label="Refund state model">
            <span>DRAFT</span><i /> <span>VERIFY</span><i /> <span>LOCK</span><i /> <span>PAY</span>
          </div>
        </aside>

        <section className="app-frame" aria-live="polite">
          <div className="prototype-ribbon"><Icon name="info" size={14} /> Independent prototype · Synthetic data only · No real refund</div>
          {screen !== "home" && (
            <div className="progress-wrap">
              <button className="back-button" onClick={back}><Icon name="back" size={18} />{c.back}</button>
              <div className="progress-info"><span>STEP {screenIndex} OF 7</span><b>{Math.round((screenIndex / 7) * 100)}%</b></div>
              <div className="progress-track"><span style={{ width: `${(screenIndex / 7) * 100}%` }} /></div>
            </div>
          )}

          {screen === "home" && (
            <div className="screen home-screen">
              <div className="service-facts" aria-label="Service information">
                <span><small>SERVICE FOR</small><b>Cancelled PRS counter tickets</b></span>
                <span><small>ACCESS</small><b>No login required</b></span>
                <span><small>STATUS</small><b>Prototype using mock systems</b></span>
              </div>
              <div className="home-visual" aria-hidden="true">
                <TicketStub />
                <div className="refund-path"><span /><i /><i /><b><Icon name="check" size={22} /></b></div>
                <div className="refund-card"><small>REFUND READY</small><strong>₹4,860</strong><span>Verified digitally</span></div>
              </div>
              <p className="eyebrow orange">{c.strap}</p>
              <h1>{c.hero}</h1>
              <p className="hero-sub">{c.sub}</p>
              <div className="trust-line"><span><Icon name="shield" size={16} />{c.proof}</span><span><Icon name="lock" size={16} />No duplicate claims</span></div>
              <BottomActions>
                <button className="primary-button" onClick={() => go("capture")}>{c.start}<Icon name="arrow" /></button>
                <button className="text-button" onClick={startManualEntry}>{c.manual}<Icon name="arrow" size={17} /></button>
              </BottomActions>
              <p className="disclaimer">Independent civic-tech concept. Not affiliated with or operated by Indian Railways or IRCTC.</p>
            </div>
          )}

          {screen === "capture" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">ADD A SYNTHETIC TICKET</p><h1>Let’s read the journey details.</h1><p>Use a clear photo of the full PRS counter ticket. For this prototype, do not upload a real passenger ticket.</p></div>
              <div className="safety-banner"><Icon name="shield" size={19} /><span><b>Synthetic tickets only</b>This demo sends the image for one-time reading, does not store it, and never contacts a government system.</span></div>
              <input ref={fileRef} className="file-input-hidden" tabIndex={-1} aria-hidden="true" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
              <button className="upload-zone" onClick={() => fileRef.current?.click()} disabled={analysis === "reading"} aria-busy={analysis === "reading"}>
                <span className="upload-icon"><Icon name={analysis === "reading" ? "sparkle" : "camera"} size={28} /></span>
                <strong>{analysis === "reading" ? "Reading ticket…" : "Take photo or upload"}</strong>
                <small>JPG, PNG or WEBP · up to 5 MB · compressed on your device</small>
                {analysis === "reading" && <span className="scan-line" />}
              </button>
              {(analysis === "fallback" || analysis === "rejected") && (
                <div className={`capture-error ${analysis}`} role="alert">
                  <span><Icon name={analysis === "rejected" ? "alert" : "info"} size={24} /></span>
                  <div><b>{analysis === "rejected" ? "This does not look like a counter ticket." : "We could not read the ticket."}</b><p>{captureMessage}</p></div>
                  <button onClick={() => fileRef.current?.click()}>Try another image</button>
                  <button onClick={startManualEntry}>Enter details manually</button>
                </div>
              )}
              <div className="or-divider"><span>or use the judge-ready sample</span></div>
              <div className="sample-row"><TicketStub faded /><div><span className="sample-badge">SYNTHETIC</span><b>Rajdhani · NDLS → DBRT</b><small>PNR 2468135790</small></div></div>
              <BottomActions>
                <button className="primary-button" onClick={runSample} disabled={analysis === "reading"}>{analysis === "reading" ? "Extracting fields…" : "Use sample ticket"}<Icon name="arrow" /></button>
                <button className="text-button" onClick={startManualEntry}>Enter details instead</button>
              </BottomActions>
            </div>
          )}

          {screen === "details" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">CHECK AND CORRECT</p><h1>{confidentFieldCount === 0 ? "Enter your ticket details." : "Check every detail before continuing."}</h1><p>AI can make mistakes. Compare these values with the printed ticket and edit anything that is wrong.</p></div>
              <div className="reader-summary"><span className="reader-icon"><Icon name="sparkle" /></span><div><b>{confidentFieldCount === 6 ? "All 6 required fields were read" : `${confidentFieldCount} of 6 required fields were read`}</b><p>Every field is editable. AI reads the ticket; fixed rules decide eligibility.</p></div></div>
              <div className="field-grid">
                <Field label="PNR" value={ticketData.pnr} status={effectiveConfidence.pnr} inputMode="numeric" maxLength={10} placeholder="10-digit PNR" error={fieldErrors.pnr} onChange={(value) => updateTicketField("pnr", value)} />
                <Field label="TRAIN NUMBER" value={effectiveTrainNumber} status={effectiveConfidence.trainNumber} inputMode="numeric" maxLength={5} placeholder="5-digit train number" error={fieldErrors.trainNumber} onChange={(value) => updateTicketField("trainNumber", value)} />
                <Field label="JOURNEY DATE" value={ticketData.date} status={effectiveConfidence.date} type="date" error={fieldErrors.date} hint="DD/MM/YYYY" onChange={(value) => updateTicketField("date", value)} />
                <Field label="FROM STATION" value={ticketData.origin} status={effectiveConfidence.origin} placeholder="e.g. New Delhi or NDLS" error={fieldErrors.origin} onChange={(value) => updateTicketField("origin", value)} />
                <Field label="TO STATION" value={ticketData.destination} status={effectiveConfidence.destination} placeholder="e.g. Dibrugarh or DBRT" error={fieldErrors.destination} onChange={(value) => updateTicketField("destination", value)} />
                <Field label="TICKET FARE (₹)" value={ticketData.fare > 0 ? String(ticketData.fare) : ""} status={effectiveConfidence.fare} type="number" inputMode="decimal" placeholder="Fare paid" error={fieldErrors.fare} onChange={(value) => updateTicketField("fare", value)} />
                <Field label="TRAIN NAME (OPTIONAL)" value={ticketData.trainName} status={ticketData.trainName ? "extracted" : "missing"} placeholder="As printed on ticket" hint="Optional" onChange={(value) => updateOptionalTicketField("trainName", value)} />
                <Field label="PASSENGERS (OPTIONAL)" value={ticketData.passengers > 0 ? String(ticketData.passengers) : ""} status={ticketData.passengers > 0 ? "extracted" : "missing"} type="number" inputMode="numeric" placeholder="Number of passengers" hint="Optional" onChange={(value) => updateOptionalTicketField("passengers", value)} />
              </div>
              {!requiredFieldsReady && <div className="inline-notice"><Icon name="alert" /><p><b>Complete the marked fields to continue.</b>Use the exact PNR, five-digit train number and journey details printed on the ticket.</p></div>}
              <label className="confirmation-check"><input type="checkbox" checked={ticketConfirmed} disabled={!requiredFieldsReady} onChange={(event) => setTicketConfirmed(event.target.checked)} /><span><b>I checked the PNR, train number and journey date.</b><small>{requiredFieldsReady ? "These three values match the printed ticket." : "Complete the marked fields first."}</small></span></label>
              <div className="privacy-note"><Icon name="lock" size={18} /><span><b>Your ticket image is not stored.</b> Only confirmed fields move to the eligibility check.</span></div>
              <BottomActions><button className="primary-button" onClick={() => go("eligibility")} disabled={!requiredFieldsReady || !ticketConfirmed}>Confirm & check cancellation<Icon name="arrow" /></button><button className="text-button" onClick={() => go("capture")}>Use a different ticket image</button></BottomActions>
            </div>
          )}

          {screen === "eligibility" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">RULE CHECK · SIMULATED</p><h1>Full refund is available.</h1><p>The ticket and mocked cancellation record pass every required check.</p></div>
              <div className="decision-card eligible"><span className="decision-icon"><Icon name="check" size={30} /></span><div><small>ELIGIBLE · 3 OF 3 CHECKS PASSED</small><strong>₹{ticketData.fare.toLocaleString("en-IN")} full fare</strong><p>No cancellation charge · {ticketData.passengers > 0 ? `${ticketData.passengers} passengers` : "passenger count verified by mock record"}</p></div></div>
              <div className="rule-list">
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>Train cancelled by Railways</b><small>Mock operations record · 23 Aug, 18:42</small></p></div>
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>PRS counter ticket</b><small>Ticket channel verified</small></p></div>
                <div><span className="rule-ok"><Icon name="check" size={15} /></span><p><b>No completed claim</b><small>Idempotency key is clear</small></p></div>
              </div>
              <div className="plain-language"><b>Why this decision?</b><p>These are fixed product rules. AI was used only to read your ticket — never to approve or calculate the refund.</p></div>
              <BottomActions><button className="primary-button" onClick={() => go("otp")}>Verify ticket ownership<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "otp" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">PROVE OWNERSHIP</p><h1>Check the booking mobile.</h1><p>A 6-digit code was sent to <b>+91 •••••• 2714</b>, the number captured when this ticket was booked.</p></div>
              <div className="otp-row" aria-label="One-time password">
                {otp.map((digit, index) => <input key={index} inputMode="numeric" maxLength={1} value={digit} aria-label={`OTP digit ${index + 1}`} onChange={(event) => { const copy = [...otp]; copy[index] = event.target.value.replace(/\D/g, ""); setOtp(copy); }} />)}
              </div>
              <div className="demo-code"><span><Icon name="sparkle" size={16} /> DEMO CODE</span><b>271406</b><button onClick={() => setOtp(["2", "7", "1", "4", "0", "6"])}>Fill code</button></div>
              <p className="attempt-note"><Icon name="shield" size={16} /> 3 attempts maximum · code expires in 10 minutes</p>
              <BottomActions><button className="primary-button" disabled={otp.join("") !== "271406"} onClick={() => go("payout")}>Verify code<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "payout" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">CHOOSE PAYOUT</p><h1>Where should ₹{ticketData.fare.toLocaleString("en-IN")} go?</h1><p>Choose a verified destination. This prototype uses masked, synthetic payment details.</p></div>
              <div className="method-tabs" role="tablist" aria-label="Refund destination"><button role="tab" aria-selected={payout === "upi"} className={payout === "upi" ? "active" : ""} onClick={() => setPayout("upi")}><Icon name="phone" />UPI</button><button role="tab" aria-selected={payout === "bank"} className={payout === "bank" ? "active" : ""} onClick={() => setPayout("bank")}><Icon name="wallet" />Bank account</button></div>
              {payout === "upi" ? (
                <div className="payout-card selected"><span className="radio-dot" /><div><small>UPI ID</small><b>asha.rail@okaxis</b><p>Account name: Asha P.</p></div><span className="verified-badge"><Icon name="check" size={13} /> VERIFIED</span></div>
              ) : (
                <div className="payout-card selected"><span className="radio-dot" /><div><small>BANK ACCOUNT</small><b>State Bank · •••• 1842</b><p>Account name: Asha P.</p></div><span className="verified-badge"><Icon name="check" size={13} /> VERIFIED</span></div>
              )}
              <div className="recipient-check"><Icon name="shield" /><div><b>Recipient name matched</b><p>Booking contact and payout name pass the prototype match check.</p></div></div>
              <div className="privacy-note"><Icon name="lock" size={18} /><span>Payment details are tokenised before the refund instruction is created.</span></div>
              <BottomActions><button className="primary-button" onClick={() => go("review")}>Review refund<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "review" && (
            <div className="screen">
              <div className="screen-heading"><p className="eyebrow">FINAL REVIEW</p><h1>Ready to start the refund.</h1><p>Nothing is paid until this final confirmation. Review the facts and consent below.</p></div>
              <div className="refund-total"><span><small>FULL REFUND</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b></span><span className="no-fee">₹0 fee</span></div>
              <div className="review-list"><div><span>Ticket</span><b>PNR {ticketData.pnr}</b></div><div><span>Journey</span><b>{ticketData.origin} → {ticketData.destination}</b></div><div><span>Journey date</span><b>{formatJourneyDate(ticketData.date)}</b></div><div><span>Cancellation</span><b className="green-text"><Icon name="check" size={14} /> Railway verified</b></div><div><span>Ownership</span><b className="green-text"><Icon name="check" size={14} /> OTP verified</b></div><div><span>Payout</span><b>{payout === "upi" ? "asha.rail@okaxis" : "SBI · •••• 1842"}</b></div></div>
              <button className="edit-link" onClick={() => go("details")}><Icon name="back" size={16} /> Edit ticket details</button>
              <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><b>I confirm these details are correct.</b><small>I consent to use these verified facts to create one refund claim for this journey.</small></span></label>
              <div className="lock-preview"><Icon name="lock" /><div><b>Duplicate lock activates first</b><p>The claim key is reserved before any payment call, so a double tap cannot create two refunds.</p></div></div>
              <BottomActions><button className="primary-button" disabled={!consent} onClick={() => go("tracking")}>Start ₹{ticketData.fare.toLocaleString("en-IN")} refund<Icon name="arrow" /></button></BottomActions>
            </div>
          )}

          {screen === "tracking" && (
            <div className="screen tracking-screen">
              <div className={`success-orbit ${paid ? "paid" : ""}`}><span><Icon name="check" size={34} /></span></div>
              <p className="eyebrow">CLAIM TW-824-613</p>
              <h1>{paid ? `₹${ticketData.fare.toLocaleString("en-IN")} has been paid.` : "Refund instruction created."}</h1>
              <p className="hero-sub">{paid ? "Sent to your verified payout destination. Keep this reference for your records." : "Your claim is locked against duplicates and ready for the payment rail."}</p>
              <div className="tracking-amount"><small>REFUND AMOUNT</small><b>₹{ticketData.fare.toLocaleString("en-IN")}</b><span className={paid ? "paid-state" : "pending-state"}>{paid ? "PAID" : "REFUND PENDING"}</span></div>
              <div className="timeline">
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>Claim locked</b><small>24 Aug · 10:41:08</small></span></div>
                <div className="complete"><i><Icon name="check" size={13} /></i><span><b>Railway cancellation verified</b><small>24 Aug · 10:41:09</small></span></div>
                <div className={paid ? "complete" : "current"}><i>{paid ? <Icon name="check" size={13} /> : <span />}</i><span><b>{paid ? "Paid to verified destination" : "Payment instruction ready"}</b><small>{paid ? "UTR 4268•••914" : "Mock payment action available below"}</small></span></div>
              </div>
              <div className="reference-row"><span>Idempotency key</span><code>{claimKey}</code></div>
              <BottomActions>
                {!paid && <button className="primary-button" disabled={retrying} onClick={() => { setRetrying(true); window.setTimeout(() => { setPaid(true); setRetrying(false); }, 900); }}>{retrying ? "Confirming with gateway…" : "Simulate payment confirmation"}<Icon name="arrow" /></button>}
                <button className="secondary-button" onClick={() => reset()}>Start another ticket</button>
              </BottomActions>
            </div>
          )}
        </section>
      </div>

      <footer className="site-footer">
        <b>Ticket Wapas · टिकट वापस</b>
        <span>Independent civic-tech prototype. Not affiliated with or operated by Indian Railways, IRCTC, or the Government of India.</span>
        <span>No real tickets, identities, OTPs, payments, or government systems are used.</span>
      </footer>

    </main>
  );
}
