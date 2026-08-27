"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

type QueueStatus = "new" | "review" | "approved" | "paid";
type Filter = "all" | QueueStatus;

type Application = {
  id: string;
  ticket: string;
  type: "PRS" | "UTS";
  route: string;
  amount: number;
  status: QueueStatus;
  updated: string;
  reason: string;
  ownership: string;
};

const applications: Application[] = [
  { id: "TW-UTS-613", ticket: "UTS7A4K219", type: "UTS", route: "New Delhi → Dehradun", amount: 165, status: "paid", updated: "12:18 PM", reason: "Train-specific UTS special cancellation", ownership: "Original-ticket possession photo matched" },
  { id: "TW-824-613", ticket: "PNR 2468135790", type: "PRS", route: "New Delhi → Dibrugarh", amount: 4860, status: "approved", updated: "11:04 AM", reason: "Railway-cancelled reserved service", ownership: "Booking mobile and ticket possession matched" },
  { id: "TW-UTS-HELP-219", ticket: "UTS9B2C314", type: "UTS", route: "Delhi Jn → Ghaziabad", amount: 60, status: "review", updated: "10:52 AM", reason: "Alternate-service availability needs review", ownership: "Original-ticket possession pending" },
  { id: "TW-HELP-2714", ticket: "PNR 7351902468", type: "PRS", route: "Jaipur → Ahmedabad", amount: 1280, status: "review", updated: "10:33 AM", reason: "Booking mobile no longer available", ownership: "Assisted verification requested" },
  { id: "TW-NEW-184", ticket: "PNR 6193048275", type: "PRS", route: "Patna → New Delhi", amount: 2145, status: "new", updated: "10:21 AM", reason: "Cancellation record found", ownership: "Citizen confirmation received" },
];

const statusLabel: Record<QueueStatus, string> = { new: "NEW", review: "NEEDS REVIEW", approved: "APPROVED", paid: "PAID" };
const demoCredentials = { username: "refund.officer", password: "Demo@824" } as const;

function Mark() {
  return <span className="portal-mark" aria-hidden="true"><i /><i /><b /></span>;
}

export default function AuthorityDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState(demoCredentials.username);
  const [password, setPassword] = useState(demoCredentials.password);
  const [authError, setAuthError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(applications[0].id);
  const filtered = useMemo(() => applications.filter((application) => {
    const matchesStatus = filter === "all" || application.status === filter;
    const haystack = `${application.id} ${application.ticket} ${application.route}`.toLowerCase();
    return matchesStatus && haystack.includes(query.trim().toLowerCase());
  }), [filter, query]);
  const previousSelection = applications.find((application) => application.id === selectedId) ?? applications[0];
  const selected = filtered.find((application) => application.id === selectedId) ?? filtered[0] ?? previousSelection;

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (username.trim().toLowerCase() === demoCredentials.username && password === demoCredentials.password) {
      setAuthError("");
      setAuthenticated(true);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    setAuthError("Those credentials do not match the mock officer account. Use the sample credentials shown below.");
  }

  function signOut() {
    setAuthenticated(false);
    setUsername(demoCredentials.username);
    setPassword(demoCredentials.password);
    setAuthError("");
    setFilter("all");
    setQuery("");
    setSelectedId(applications[0].id);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  if (!authenticated) {
    return (
      <main className="site-shell authority-shell authority-login-shell">
        <div className="service-strip"><span>REFUND OPERATIONS · रिफंड संचालन</span><b>Authorised staff access</b></div>
        <header className="topbar authority-topbar"><Link className="brand-button" href="/" aria-label="Ticket Wapas citizen service"><Mark /><span className="brand-copy"><b>TICKET WAPAS</b><small>REFUND OPERATIONS</small></span></Link><div className="header-actions"><Link className="account-link" href="/">Citizen service</Link></div></header>

        <div className="authority-login-workspace">
          <section className="authority-login-card">
            <div className="authority-login-intro"><span className="authority-lock" aria-hidden="true">✓</span><div><p className="eyebrow">AUTHORISED STAFF ACCESS</p><h1>Sign in to refund operations</h1><p>Review citizen refund applications, pending checks and payment status.</p></div></div>

            <form className="authority-login-form" onSubmit={signIn}>
              <label><span>OFFICER USERNAME</span><input aria-label="Officer username" autoCapitalize="none" autoComplete="username" spellCheck={false} placeholder="Enter username" value={username} onChange={(event) => { setUsername(event.target.value); setAuthError(""); }} /></label>
              <label><span>PASSWORD</span><input aria-label="Officer password" autoComplete="current-password" placeholder="Enter password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setAuthError(""); }} /></label>
              {authError && <p className="authority-login-error" role="alert">{authError}</p>}
              <button className="primary-button" type="submit" disabled={!username.trim() || !password}>Sign in securely →</button>
            </form>

            <p className="authority-login-note"><b>Protected operations view</b><span>Personal and payment information is masked. This account has review access only.</span></p>
          </section>
        </div>

        <footer className="site-footer authority-footer"><b>Ticket Wapas · Refund operations</b><span>Independent prototype using synthetic data. No real Railway system or refund is connected. Not affiliated with Indian Railways, IRCTC or the Government of India.</span><span><Link href="/service-information">Service information</Link> · <Link href="/status">Citizen refund sign-in</Link></span></footer>
      </main>
    );
  }

  return (
    <main className="site-shell authority-shell">
      <div className="service-strip"><span>REFUND OPERATIONS · रिफंड संचालन</span><b>Application status and review queue</b></div>
      <header className="topbar authority-topbar"><Link className="brand-button" href="/" aria-label="Ticket Wapas citizen service"><Mark /><span className="brand-copy"><b>TICKET WAPAS</b><small>REFUND OPERATIONS</small></span></Link><div className="header-actions"><span className="operator-badge"><i>RO</i><span><b>Refund officer</b><small>Review access</small></span></span><button className="account-link authority-signout" type="button" onClick={signOut}>Sign out</button><Link className="account-link" href="/">Citizen service</Link></div></header>

      <div className="authority-workspace">
        <div className="authority-heading"><div><p className="eyebrow">APPLICATION QUEUE</p><h1>Refund applications</h1><p>Review the status of citizen requests without exposing ticket images, mobile numbers or full payment details.</p></div><span className="last-sync">Data updated<br /><b>27 Aug 2026 · 12:20 PM</b></span></div>
        <div className="authority-access"><b>View-only access</b><span>Personal and payment information is masked. Payment approval requires a separately authorised role.</span></div>
        <section className="metric-grid" aria-label="Application summary"><article><span>ALL OPEN</span><b>4</b><small>1 new · 2 need review · 1 approved</small></article><article><span>NEEDS REVIEW</span><b>2</b><small>Oldest waiting 1h 47m</small></article><article><span>APPROVED VALUE</span><b>₹4,860</b><small>Ready for payment</small></article><article><span>PAID TODAY</span><b>7</b><small>₹18,425 refund value</small></article></section>

        <section className="queue-panel">
          <div className="queue-toolbar"><div className="queue-filters" role="group" aria-label="Filter applications">{(["all", "new", "review", "approved", "paid"] as Filter[]).map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item === "all" ? "All" : statusLabel[item]}</button>)}</div><label className="queue-search"><span>Search</span><input aria-label="Search applications" placeholder="Claim, PNR, UTS or route" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
          <div className="queue-layout">
            <div className="application-list" aria-live="polite">
              <div className="application-row application-head"><span>Application</span><span>Route</span><span>Amount</span><span>Status</span><span>Updated</span></div>
              {filtered.map((application) => <button className={`application-row ${selected.id === application.id ? "selected" : ""}`} key={application.id} onClick={() => setSelectedId(application.id)}><span className="application-id"><b>{application.id}</b><small>{application.type} · {application.ticket}</small></span><span>{application.route}</span><strong>₹{application.amount.toLocaleString("en-IN")}</strong><em className={`queue-status ${application.status}`}>{statusLabel[application.status]}</em><span>{application.updated}</span></button>)}
              {filtered.length === 0 && <div className="queue-empty"><b>No applications found</b><span>Try another reference, ticket number, route or status.</span></div>}
            </div>

            <aside className="application-detail" aria-label="Selected application details">
              <div className="detail-header"><span><small>APPLICATION</small><b>{selected.id}</b></span><em className={`queue-status ${selected.status}`}>{statusLabel[selected.status]}</em></div>
              <h2>{selected.route}</h2><p>{selected.type} counter ticket · {selected.ticket}</p>
              <div className="detail-amount"><span><small>REFUND VALUE</small><b>₹{selected.amount.toLocaleString("en-IN")}</b></span><span><small>LAST UPDATED</small><b>{selected.updated}</b></span></div>
              <dl className="detail-checks"><div><dt>Eligibility reason</dt><dd>{selected.reason}</dd></div><div><dt>Ticket holder check</dt><dd>{selected.ownership}</dd></div><div><dt>Duplicate refund check</dt><dd className="safe-text">No earlier refund found</dd></div><div><dt>Payment details</dt><dd>Masked destination only</dd></div></dl>
              <div className="detail-history"><b>Application history</b><p><i />Citizen submitted request <small>10:41 AM</small></p><p><i />Ticket and cancellation checks completed <small>10:42 AM</small></p><p className={selected.status === "review" || selected.status === "new" ? "current" : ""}><i />{selected.status === "paid" ? "Refund payment confirmed" : selected.status === "approved" ? "Approved for payment" : "Waiting for authorised review"} <small>{selected.updated}</small></p></div>
              <div className="read-only-note"><b>Role permissions</b><span>This role can view and triage applications. Cancellation and payment approval require separate authorised access.</span></div>
            </aside>
          </div>
        </section>
      </div>
      <footer className="site-footer authority-footer"><b>Ticket Wapas · Refund operations</b><span>Independent prototype using synthetic data. No real Railway system or refund is connected. Not affiliated with Indian Railways, IRCTC or the Government of India.</span><span><Link href="/service-information">Service information</Link> · <Link href="/status">Citizen refund sign-in</Link></span></footer>
    </main>
  );
}
