import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Service information — Ticket Wapas",
  description: "How the Ticket Wapas counter-ticket refund journey works, including PRS and UTS ticket details and official Railway sources.",
};

function Mark() {
  return <span className="portal-mark" aria-hidden="true"><i /><i /><b /></span>;
}

const officialSources = [
  { label: "Counter and e-ticket booking volumes", owner: "Ministry of Railways · 22 July 2026", href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287719&lang=1&reg=48" },
  { label: "E-ticket automatic refunds and the counter-ticket gap", owner: "Ministry of Railways · 12 August 2026", href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298355&lang=1&reg=48" },
  { label: "Refund and cancellation rules", owner: "IRCTC · January 2026", href: "https://contents.irctc.co.in/en/RefundCancellationRules.pdf" },
  { label: "Current counter-ticket cancellation procedure", owner: "IRCTC Operations", href: "https://www.operations.irctc.co.in/ctcan/SystemTktCanLogin.jsf" },
  { label: "Official PNR enquiry", owner: "Indian Railways", href: "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en" },
  { label: "UTS ticket fields and special-cancellation process", owner: "Indian Railways training material", href: "https://scr.indianrailways.gov.in/cris/uploads/files/1663215899297-Coaching%20Theory-April%202022.pdf" },
];

export default function ServiceInformationPage() {
  return (
    <main className="site-shell information-shell">
      <div className="service-strip"><span>SERVICE INFORMATION · सेवा की जानकारी</span><b>Rules, process and official sources</b></div>
      <header className="topbar information-topbar"><Link className="brand-button" href="/" aria-label="Ticket Wapas home"><Mark /><span className="brand-copy"><b>TICKET WAPAS</b><small>COUNTER-TICKET REFUND SERVICE</small></span></Link><div className="header-actions"><Link className="account-link" href="/status">Sign in</Link><Link className="primary-nav-link" href="/">Start refund</Link></div></header>

      <div className="information-workspace">
        <section className="information-hero"><div><p className="eyebrow">SERVICE INFORMATION</p><h1>How the counter-ticket refund journey works</h1><p>Ticket Wapas guides a passenger from a physical PRS or UTS ticket to the correct cancellation, ownership and refund steps in one mobile-friendly journey.</p><div className="information-actions"><Link className="primary-button" href="/">Start refund journey →</Link><Link className="secondary-button" href="/status">Track an existing refund</Link></div></div><aside className="volume-card"><small>PHYSICAL COUNTER BOOKINGS</small><b>7.18 crore</b><p>counter bookings were recorded from June 2025 to June 2026—11% of 65.08 crore reserved-ticket bookings.</p><a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287719&lang=1&reg=48" target="_blank" rel="noreferrer">Ministry of Railways source ↗</a><em>This is booking volume, not the number of cancellations or refund claims.</em></aside></section>

        <section className="information-section"><div className="section-heading"><p className="eyebrow">WHO THIS IS FOR</p><h2>Two paper-ticket types, two correct paths</h2><p>The service first identifies what is actually printed on the ticket instead of asking every passenger for a PNR.</p></div><div className="ticket-explainer-grid"><article><span className="ticket-kind">RESERVED · PRS</span><h3>Ticket with a 10-digit PNR</h3><p>Issued for a specific train and journey with confirmed, RAC or wait-list status. Ownership may use the booking mobile plus possession of the original paper ticket.</p><ul><li>PNR and train number</li><li>Passenger and reservation status</li><li>Journey-specific refund rules</li></ul></article><article><span className="ticket-kind uts">GENERAL / UNRESERVED · UTS</span><h3>Ticket with an alphanumeric UTS number</h3><p>Usually authorises travel on a route and class rather than reserving one seat. A train number or booking mobile may not exist.</p><ul><li>No PNR required</li><li>Route and journey date</li><li>Special cancellation only when its conditions apply</li></ul></article></div></section>

        <section className="information-section process-section"><div className="section-heading"><p className="eyebrow">END-TO-END PROCESS</p><h2>What happens after you add a ticket</h2></div><ol className="service-process"><li><span>1</span><div><b>Read and confirm the ticket</b><p>The ticket reader fills visible fields. The citizen edits and confirms every important value before any decision.</p></div></li><li><span>2</span><div><b>Check the final service event</b><p>The correct train, date and route are checked for cancellation, restoration, diversion or an alternate permitted service.</p></div></li><li><span>3</span><div><b>Confirm the ticket holder and original ticket</b><p>PRS and UTS use different ownership paths. The original paper ticket must be made unusable before a digital refund can safely proceed.</p></div></li><li><span>4</span><div><b>Prevent duplicates and send the refund</b><p>An earlier claim is checked first. The citizen then confirms the refund destination and receives a reference with a status timeline.</p></div></li></ol></section>

        <section className="information-section checks-section"><div className="section-heading"><p className="eyebrow">BEFORE A REFUND STARTS</p><h2>Five checks protect the passenger and the system</h2></div><div className="check-grid"><article><b>Ticket record</b><p>Identifier and printed journey details match the correct PRS or UTS record.</p></article><article><b>Final train status</b><p>A temporary cancellation cannot create a premature refund if the service is later restored.</p></article><article><b>Published rule</b><p>Ticket type, disruption, deadline and amount are evaluated with fixed rules—not invented by AI.</p></article><article><b>Ticket holder</b><p>Booking-mobile verification, assisted review or original-ticket possession is used as applicable.</p></article><article><b>Refund destination</b><p>The original payment source is preferred; a new destination needs a separate name check.</p></article></div></section>

        <section className="information-section current-gap"><div><p className="eyebrow">WHY THIS SERVICE IS NEEDED</p><h2>The remaining paper-ticket gap</h2><p>Published counter-ticket procedures can mark a ticket cancelled online while still requiring the passenger to surrender the original paper ticket at an authorised counter to collect the refund. Ticket Wapas demonstrates how an authorised digital surrender, duplicate lock and payment trail could remove that second journey.</p></div><div className="gap-note"><b>What would be required for production</b><p>Authorised PRS/UTS access, a Railway-approved way to invalidate the paper ticket, final cancellation events, role-based staff access, identity recovery, payment integration and an auditable grievance route.</p></div></section>

        <section className="information-section sources-section"><div className="section-heading"><p className="eyebrow">OFFICIAL INFORMATION</p><h2>Railway and Government sources</h2><p>These links explain the scale, ticket types and current refund process. Last reviewed 27 August 2026.</p></div><div className="source-list">{officialSources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}><span><b>{source.label}</b><small>{source.owner}</small></span><em>Open source ↗</em></a>)}</div></section>
      </div>

      <footer className="site-footer information-footer"><b>Ticket Wapas · टिकट वापस</b><span>Independent prototype using synthetic data. No real Railway system or refund is connected. Not affiliated with Indian Railways, IRCTC or the Government of India.</span><span><Link href="/">Citizen service</Link> · <Link href="/status">Refund status</Link> · <Link href="/authority">Authority view</Link></span></footer>
    </main>
  );
}
