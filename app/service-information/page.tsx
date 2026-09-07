import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Service information — Ticket Wapas",
  description: "How Ticket Wapas prototypes remote surrender and refund for a cancelled reserved PRS counter ticket.",
};

function Mark() {
  return <span className="portal-mark" aria-hidden="true"><i /><i /><b /></span>;
}

const officialSources = [
  { label: "Counter and e-ticket booking volumes", owner: "Ministry of Railways · 22 July 2026", href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287719&lang=1&reg=48" },
  { label: "E-ticket automatic refunds and the counter-ticket gap", owner: "Ministry of Railways · 12 August 2026", href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298355&lang=1&reg=48" },
  { label: "Refund and cancellation rules", owner: "IRCTC · January 2026", href: "https://contents.irctc.co.in/en/RefundCancellationRules.pdf" },
  { label: "Current counter-ticket cancellation procedure", owner: "IRCTC Operations", href: "https://www.operations.irctc.co.in/ctcan/SystemTktCanLogin.jsf" },
  { label: "Refund procedure for counter tickets paid by card/POS", owner: "Ministry of Railways", href: "https://www.pib.gov.in/newsite/PrintRelease.aspx?lang=2&reg=48&relid=157554" },
  { label: "Official PNR enquiry", owner: "Indian Railways", href: "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en" },
  { label: "UTS ticket fields and special-cancellation process", owner: "Indian Railways training material", href: "https://scr.indianrailways.gov.in/cris/uploads/files/1663215899297-Coaching%20Theory-April%202022.pdf" },
];

export default function ServiceInformationPage() {
  return (
    <main className="site-shell information-shell">
      <div className="service-strip"><span>SERVICE INFORMATION · सेवा की जानकारी</span><b>Rules, process and official sources</b></div>
      <header className="topbar information-topbar"><Link className="brand-button" href="/" aria-label="Ticket Wapas home"><Mark /><span className="brand-copy"><b>TICKET WAPAS</b><small>COUNTER-TICKET REFUND SERVICE</small></span></Link><div className="header-actions"><Link className="account-link" href="/status">Sign in</Link><Link className="primary-nav-link" href="/">Start refund</Link></div></header>

      <div className="information-workspace">
        <section className="information-hero"><div><p className="eyebrow">SERVICE INFORMATION</p><h1>A cancelled train should not create another station journey</h1><p>Ticket Wapas prototypes the missing remote path for a reserved PRS counter ticket: confirm the ticket and final cancellation, prove ownership, request an authorised ticket-record surrender and receive a trackable refund receipt.</p><div className="information-actions"><Link className="primary-button" href="/">Start refund journey →</Link><Link className="secondary-button" href="/status">Track an existing refund</Link></div></div><aside className="volume-card"><small>RESERVED COUNTER BOOKINGS</small><b>7.18 crore</b><p>counter bookings were recorded from June 2025 to June 2026—11% of 65.08 crore reserved-ticket bookings.</p><a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287719&lang=1&reg=48" target="_blank" rel="noreferrer">Ministry of Railways source ↗</a><em>This is booking volume, not the number of cancellations or refund claims.</em></aside></section>

        <section className="information-section"><div className="section-heading"><p className="eyebrow">WHO THIS IS FOR</p><h2>One primary service, with a safe boundary</h2><p>The remote-refund journey is designed for a reserved PRS paper ticket with a 10-digit PNR when Railways has finally cancelled the train.</p></div><div className="ticket-explainer-grid"><article><span className="ticket-kind">PRIMARY · RESERVED PRS</span><h3>Ticket with a 10-digit PNR</h3><p>Issued for a specific train and journey. The booking mobile is retrieved from the simulated PRS record after the PNR matches—it is not read from the ticket photo.</p><ul><li>PNR, train and journey match</li><li>Final cancellation event</li><li>Booking-mobile and ticket-possession checks</li></ul></article><article><span className="ticket-kind uts">SEPARATE · GENERAL / UTS</span><h3>Different ticket, different rules</h3><p>An unreserved ticket can cover a route or time window and may not identify one train or booking mobile. Ticket Wapas routes it to an authorised UTS check instead of promising a PRS refund.</p><ul><li>No PRS refund assumption</li><li>Zone and alternate-service rules required</li><li>No automatic recipient or amount</li></ul></article></div></section>

        <section className="information-section process-section"><div className="section-heading"><p className="eyebrow">END-TO-END PROCESS</p><h2>How the proposed remote surrender works</h2></div><ol className="service-process"><li><span>1</span><div><b>Read and confirm</b><p>AI fills only visible ticket fields. The citizen corrects them; AI never decides the refund.</p></div></li><li><span>2</span><div><b>Match authoritative records</b><p>A production service would check the PRS ticket and the final cancellation or later restoration event.</p></div></li><li><span>3</span><div><b>Verify and surrender</b><p>The booking mobile and fresh possession proof are checked before one authorised PRS status update is requested.</p></div></li><li><span>4</span><div><b>Refund and issue receipt</b><p>The original payment source is preferred. Cash tickets use a separately checked destination, and retries return the same receipt.</p></div></li></ol></section>

        <section className="information-section checks-section"><div className="section-heading"><p className="eyebrow">BEFORE A REFUND STARTS</p><h2>Five checks protect the passenger and the system</h2></div><div className="check-grid"><article><b>PRS record</b><p>PNR, train number and journey date match an authorised reserved-ticket record.</p></article><article><b>Final train status</b><p>A pending or restored cancellation cannot create a premature refund.</p></article><article><b>Ticket holder</b><p>The booking mobile comes from PRS; a photo only supports present possession.</p></article><article><b>One surrender</b><p>One ticket, journey and final cancellation event return one persistent receipt.</p></article><article><b>Refund destination</b><p>Original payment is preferred; a cash-ticket destination needs a separate name check.</p></article></div></section>

        <section className="information-section current-gap"><div><p className="eyebrow">WHAT IS REAL AND WHAT IS PROPOSED</p><h2>The photo is not the surrender</h2><p>Current published procedures still require the original journey ticket at a PRS counter. Ticket Wapas proposes that an authorised PRS record change—not the image—would replace that physical handover and block a second refund. The prototype simulates this transaction and issues a persistent receipt.</p></div><div className="gap-note"><b>Required for production</b><p>Approved PRS write access, a final cancellation-event contract, Railway policy for remote surrender, booking-mobile recovery, regulated payout integration, audit logs and an assisted dispute route. No live Railway integration is used here.</p></div></section>

        <section className="information-section sources-section"><div className="section-heading"><p className="eyebrow">OFFICIAL INFORMATION</p><h2>Railway and Government sources</h2><p>These links explain the scale, ticket types and current refund process. Last reviewed 7 September 2026.</p></div><div className="source-list">{officialSources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}><span><b>{source.label}</b><small>{source.owner}</small></span><em>Open source ↗</em></a>)}</div></section>
      </div>

      <footer className="site-footer information-footer"><b>Ticket Wapas · टिकट वापस</b><span>Independent prototype using synthetic data. No real Railway system or refund is connected. Not affiliated with Indian Railways, IRCTC or the Government of India.</span><span><Link href="/">Citizen service</Link> · <Link href="/status">Refund status</Link> · <Link href="/authority">Authority view</Link></span></footer>
    </main>
  );
}
