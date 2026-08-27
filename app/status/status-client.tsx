"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lang = "en" | "hi";
type Stage = "signin" | "otp" | "account" | "detail";
type ClaimStatus = "paid" | "processing";

type Claim = {
  id: string;
  ticket: string;
  route: string;
  amount: number;
  status: ClaimStatus;
  updated: string;
  destination: string;
};

const claims: Claim[] = [
  { id: "TW-UTS-613", ticket: "UTS7A4K219", route: "New Delhi → Dehradun", amount: 165, status: "paid", updated: "27 Aug 2026 · 12:18 PM", destination: "UPI · asha.rail@okaxis" },
  { id: "TW-824-613", ticket: "PNR 2468135790", route: "New Delhi → Dibrugarh", amount: 4860, status: "processing", updated: "27 Aug 2026 · 11:04 AM", destination: "Bank account · •••• 1842" },
];

function Mark() {
  return <span className="portal-mark" aria-hidden="true"><i /><i /><b /></span>;
}

function Tick() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="portal-icon"><path d="m6 12 4 4 8-9" /></svg>;
}

export default function RefundStatusClient() {
  const [lang, setLang] = useState<Lang>("en");
  const [stage, setStage] = useState<Stage>("signin");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [selectedId, setSelectedId] = useState(claims[0].id);
  const selectedClaim = claims.find((claim) => claim.id === selectedId) ?? claims[0];
  const tr = (english: string, hindi: string) => lang === "hi" ? hindi : english;

  useEffect(() => {
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
  }, [lang]);

  function signOut() {
    setStage("signin");
    setMobile("");
    setOtp("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function go(next: Stage) {
    setStage(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <main className="site-shell portal-shell">
      <div className="service-strip">
        <span>CITIZEN REFUND ACCOUNT · नागरिक रिफंड खाता</span>
        <b>{tr("Refund history and claim status", "रिफंड इतिहास और दावे की स्थिति")}</b>
      </div>
      <header className="topbar portal-topbar">
        <Link className="brand-button" href="/" aria-label="Ticket Wapas home"><Mark /><span className="brand-copy"><b>TICKET WAPAS</b><small>टिकट वापस · CITIZEN REFUND SERVICE</small></span></Link>
        <div className="header-actions">
          <div className="language-toggle" role="group" aria-label="Choose language"><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button><button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हिं</button></div>
        </div>
      </header>

      <div className="workspace portal-workspace">
        <section className="app-frame portal-frame" aria-live="polite">
          {stage === "signin" && <div className="screen portal-screen">
            <Link className="portal-back" href="/">← {tr("Back to refund service", "रिफंड सेवा पर वापस")}</Link>
            <div className="screen-heading"><p className="eyebrow">{tr("CITIZEN ACCOUNT", "नागरिक खाता")}</p><h1>{tr("Sign in to track your refund.", "रिफंड देखने के लिए साइन इन करें।")}</h1><p>{tr("Use the mobile connected to your request. On this page, use only the sample number below.", "अपने अनुरोध से जुड़े मोबाइल का उपयोग करें। इस पेज पर केवल नीचे दिया नमूना नंबर इस्तेमाल करें।")}</p></div>
            <label className="portal-input-card"><span>{tr("MOBILE NUMBER", "मोबाइल नंबर")}</span><div className="mobile-input-row"><b>+91</b><input aria-label={tr("Sample mobile number", "नमूना मोबाइल नंबर")} inputMode="numeric" maxLength={10} placeholder="98765 42714" value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} /></div><small>{tr("Sample data only — do not enter your real mobile number.", "केवल नमूना डेटा — अपना असली मोबाइल नंबर न भरें।")}</small></label>
            <button className="sample-fill" onClick={() => setMobile("9876542714")}>{tr("Use sample number 98765 42714", "नमूना नंबर 98765 42714 इस्तेमाल करें")}</button>
            <div className="privacy-note portal-privacy"><span className="privacy-symbol">✓</span><span><b>{tr("No password is needed", "पासवर्ड की ज़रूरत नहीं")}</b> {tr("A one-time code protects access to refund history.", "एक बार का कोड रिफंड इतिहास की सुरक्षा करता है।")}</span></div>
            <div className="bottom-actions"><button className="primary-button" disabled={!/^\d{10}$/.test(mobile)} onClick={() => go("otp")}>{tr("Send one-time code", "एक बार का कोड भेजें")} →</button></div>
          </div>}

          {stage === "otp" && <div className="screen portal-screen">
            <button className="portal-back as-button" onClick={() => go("signin")}>← {tr("Change mobile number", "मोबाइल नंबर बदलें")}</button>
            <div className="screen-heading"><p className="eyebrow">{tr("SECURE SIGN-IN", "सुरक्षित साइन-इन")}</p><h1>{tr("Enter the 6-digit code.", "6 अंकों का कोड भरें।")}</h1><p>{tr("Code sent to +91 •••••• 2714. Use the visible sample code below.", "कोड +91 •••••• 2714 पर भेजा गया। नीचे दिखाया नमूना कोड इस्तेमाल करें।")}</p></div>
            <label className="portal-input-card otp-card"><span>{tr("ONE-TIME CODE", "एक बार का कोड")}</span><input className="auth-otp-input" aria-label={tr("Six-digit demo code", "छह अंकों का डेमो कोड")} inputMode="numeric" maxLength={6} placeholder="— — — — — —" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} /><small>{tr("Enter the code shown below.", "नीचे दिखाया कोड भरें।")}</small></label>
            <div className="demo-code portal-demo-code"><span>{tr("DEMO CODE", "डेमो कोड")}</span><b>246810</b><button onClick={() => setOtp("246810")}>{tr("Fill code", "कोड भरें")}</button></div>
            {otp.length === 6 && otp !== "246810" && <p className="auth-error" role="alert">{tr("That code does not match the demo code.", "यह कोड डेमो कोड से मेल नहीं खाता।")}</p>}
            <div className="bottom-actions"><button className="primary-button" disabled={otp !== "246810"} onClick={() => go("account")}>{tr("Verify and sign in", "पुष्टि करके साइन इन करें")} →</button></div>
          </div>}

          {stage === "account" && <div className="screen portal-screen account-screen">
            <div className="account-welcome"><div><p className="eyebrow">{tr("SIGNED IN", "साइन इन")}</p><h1>{tr("Your refunds", "आपके रिफंड")}</h1><p>{tr("Signed in as Asha P. · +91 •••••• 2714", "आशा P. के रूप में साइन इन · +91 •••••• 2714")}</p></div><span className="account-avatar">AP</span></div>
            <div className="account-summary"><span><b>2</b><small>{tr("REFUND REQUESTS", "रिफंड अनुरोध")}</small></span><span><b>₹5,025</b><small>{tr("TOTAL REFUND VALUE", "कुल रिफंड राशि")}</small></span></div>
            <div className="claim-list">
              {claims.map((claim) => <article className="claim-card" key={claim.id}><div className="claim-card-top"><span><small>{tr("CLAIM", "दावा")}</small><b>{claim.id}</b></span><em className={`claim-status ${claim.status}`}>{claim.status === "paid" ? tr("PAID", "भुगतान हुआ") : tr("PROCESSING", "प्रक्रिया में")}</em></div><p>{claim.ticket} · {claim.route}</p><div className="claim-amount"><strong>₹{claim.amount.toLocaleString("en-IN")}</strong><small>{claim.status === "paid" ? tr("Paid to selected account", "चुने खाते में भुगतान हुआ") : tr("Refund is being sent", "रिफंड भेजा जा रहा है")}</small></div><button className="claim-open" onClick={() => { setSelectedId(claim.id); go("detail"); }}>{tr("View status", "स्थिति देखें")} →</button></article>)}
            </div>
            <Link className="start-new-link" href="/">+ {tr("Start another refund request", "दूसरा रिफंड अनुरोध शुरू करें")}</Link>
            <button className="portal-text-signout" onClick={signOut}>{tr("Sign out of this account", "इस खाते से साइन आउट करें")}</button>
          </div>}

          {stage === "detail" && <div className="screen portal-screen claim-detail-screen">
            <button className="portal-back as-button" onClick={() => go("account")}>← {tr("All refunds", "सभी रिफंड")}</button>
            <div className="claim-detail-heading"><div><p className="eyebrow">{tr("CLAIM", "दावा")} {selectedClaim.id}</p><h1>{selectedClaim.status === "paid" ? tr(`₹${selectedClaim.amount.toLocaleString("en-IN")} has been paid.`, `₹${selectedClaim.amount.toLocaleString("en-IN")} का भुगतान हो गया।`) : tr("Your refund is being processed.", "आपका रिफंड प्रक्रिया में है।")}</h1><p>{tr(`Last updated ${selectedClaim.updated}`, `अंतिम अपडेट ${selectedClaim.updated}`)}</p></div><em className={`claim-status large ${selectedClaim.status}`}>{selectedClaim.status === "paid" ? tr("PAID", "भुगतान हुआ") : tr("PROCESSING", "प्रक्रिया में")}</em></div>
            <div className="claim-facts"><div><span>{tr("Ticket", "टिकट")}</span><b>{selectedClaim.ticket}</b></div><div><span>{tr("Journey", "यात्रा")}</span><b>{selectedClaim.route}</b></div><div><span>{tr("Refund destination", "रिफंड का स्थान")}</span><b>{selectedClaim.destination}</b></div></div>
            <div className="account-timeline">
              <div className="done"><i><Tick /></i><span><b>{tr("Refund request created", "रिफंड अनुरोध बना")}</b><small>27 Aug · 10:41 AM</small></span></div>
              <div className="done"><i><Tick /></i><span><b>{tr("Eligibility and duplicate check completed", "योग्यता और डुप्लिकेट जाँच पूरी")}</b><small>27 Aug · 10:42 AM</small></span></div>
              <div className="done"><i><Tick /></i><span><b>{tr("Paper ticket cancellation recorded", "कागज़ी टिकट रद्द दर्ज हुआ")}</b><small>27 Aug · 10:43 AM</small></span></div>
              <div className={selectedClaim.status === "paid" ? "done" : "current"}><i>{selectedClaim.status === "paid" ? <Tick /> : <span />}</i><span><b>{selectedClaim.status === "paid" ? tr("Refund paid", "रिफंड भुगतान हुआ") : tr("Payment in progress", "भुगतान प्रक्रिया में")}</b><small>{selectedClaim.status === "paid" ? "27 Aug · 12:18 PM" : tr("Usually completed within the shown service window", "आमतौर पर दिखाई गई सेवा अवधि में पूरा होता है")}</small></span></div>
            </div>
            <div className="help-card"><b>{tr("Need help with this refund?", "इस रिफंड में सहायता चाहिए?")}</b><p>{tr(`Quote ${selectedClaim.id} when contacting the authorised support channel.`, `अधिकृत सहायता चैनल से संपर्क करते समय ${selectedClaim.id} बताएँ।`)}</p></div>
          </div>}
        </section>
      </div>

      <footer className="site-footer portal-footer"><b>Ticket Wapas · टिकट वापस</b><span>{tr("Independent prototype using synthetic data. No real Railway system or refund is connected. Not affiliated with Indian Railways, IRCTC or the Government of India.", "स्वतंत्र प्रोटोटाइप, जिसमें नकली डेटा इस्तेमाल होता है। कोई असली रेलवे सिस्टम या रिफंड जुड़ा नहीं है। भारतीय रेल, IRCTC या भारत सरकार से संबद्ध नहीं।")}</span><span><Link href="/service-information">{tr("Service information", "सेवा की जानकारी")}</Link> · <Link href="/authority">{tr("Authority view", "प्राधिकरण दृश्य")}</Link></span></footer>
    </main>
  );
}
