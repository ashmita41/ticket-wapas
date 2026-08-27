# Ticket Wapas — submission package

## Project summary (229 words)

Ticket Wapas helps passengers who bought a physical railway counter ticket and then had their service cancelled by Railways. E-ticket refunds can be automatic, while counter-ticket passengers may still need another visit after their journey fails.

Our prototype makes this one guided mobile journey. An OpenAI model rejects unrelated images, classifies PRS/UTS tickets and extracts only printed fields. Citizens confirm critical identifiers; product rules—not AI—check simulated cancellation and duplicate-refund state. PRS ownership uses a mock booking-mobile OTP plus fresh ticket-possession proof. UTS never invents a PNR or booking mobile: a train-specific synthetic ticket can complete special cancellation, while an ordinary route ticket stops for the required alternate-service check. Eligible samples continue to synthetic payout and tracking.

The main citizen journey works end to end. Unrelated uploads are rejected without advancing, unreadable fields can be corrected manually, critical identifiers require citizen confirmation, and duplicate protection is visible before the mocked payout begins. Citizens can later sign in with a visible demo OTP to reopen status; a separate authority area uses a prefilled sample officer login before showing masked applications. All tickets, railway responses, OTPs, identities and payments are synthetic and clearly labelled.

Ticket Wapas is simpler because it keeps the citizen in one bilingual, mobile-first flow; safer because every critical detail is confirmed before the refund starts; and more resilient because failed or unclear ticket reading always has an honest manual path.

## Two-minute video script

### 0:00–1:00 — citizen demonstration

- **0:00–0:08:** “I bought this ticket at a railway counter. My train was cancelled, but getting the refund can still mean returning to a PRS counter.”
- **0:08–0:19:** Open Ticket Wapas and choose the synthetic sample ticket. Point out that the image is not stored.
- **0:19–0:31:** Check and correct the PNR, train, date, route and fare. Say: “The ticket reader fills the form, but the citizen confirms every important detail.”
- **0:31–0:42:** Show the three plain-language eligibility checks and the clear refund result.
- **0:42–0:51:** Fill the visible demo OTP and select the synthetic UPI destination.
- **0:51–1:00:** Actively confirm once and send the refund. End on the paid state and citizen-friendly payment reference; the citizen is never asked to “complete payment.”

### 1:00–2:00 — how and why

- **1:00–1:14:** Explain the real gap: automatic e-ticket refunds versus a physical return journey for some counter-ticket cases.
- **1:14–1:29:** Show the architecture: OpenAI structured ticket extraction, deterministic eligibility, ownership verification, claim lock, payment adapter and audit trail.
- **1:29–1:42:** Return to ticket capture and briefly show the General/UTS sample: no PNR, no booking-mobile OTP and a separate special-cancellation rule.
- **1:42–1:52:** Show that citizens can later sign in and reopen the exact same amount, destination and paid status. Keep the authority queue out of the main video unless specifically requested.
- **1:52–2:00:** Explain the synthetic-data boundary, then close: “The refund moves to the passenger instead of making the passenger travel for it.”

## Final submission checklist

- [x] Public browser link that requests no access — <https://ticket-wapas.ticket-wapas-ashmita41.workers.dev/>
- [ ] Video is 2:00 or shorter and follows the 1-minute/1-minute structure
- [x] Project summary is below 250 words
- [x] The primary refund journey requires no login; optional citizen status and authority access use visible sample credentials
- [x] All links and the complete citizen journey work
- [x] Mock systems and synthetic data are disclosed
- [ ] Add partner’s registered email, or leave blank if solo
- [ ] Submit before **28 August 2026, 8:00 PM IST**

## Requirement audit

| Brief requirement | Prototype evidence | Status |
|---|---|---|
| One clearly defined problem | Cancelled-service refund for a physical railway counter ticket, with the correct PRS/UTS route | Meets |
| Complete citizen journey | Capture → editable confirmation → eligibility → ownership → payout → review → tracking; optional sign-in reopens history | Meets |
| Simpler than the current experience | One guided flow with plain-language decisions, visible progress and recovery at every input failure | Meets |
| Indian users and mobile | Bilingual public-service header; single-column phone forms; native date picker; large controls; manual fallback | Meets |
| Synthetic sensitive dependencies | Ticket, OTP, Railway status, identity and payment data are synthetic | Meets |
| Meaningful Codex/OpenAI use | Codex-built product; server-side structured ticket extraction using an OpenAI model | Meets |
| Working, not static | The complete citizen flow works; unrelated uploads and invalid ticket fields stop safely with clear recovery | Meets |
| Backend and process thinking | Deterministic rules, state transitions, retry and audit references plus a separate read-only authority queue | Meets |
| Honest limitations | Government-service familiarity without official logos; one restrained footer disclosure plus a dedicated sourced service-information page | Meets |
| No unsafe government-system access | No scraping, live government calls or undocumented APIs | Meets |
| Public submission URL | Public Cloudflare deployment requiring no login or access request | Meets |
| Two-minute video | Script is ready; recording still required | **Does not yet meet** |
