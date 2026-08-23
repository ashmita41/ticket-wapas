# Ticket Wapas — submission package

## Project summary (208 words)

Ticket Wapas helps passengers who bought a physical PRS railway counter ticket and then had their train cancelled by Railways. E-ticket refunds can be automatic, but a counter-ticket passenger may still need to return to a PRS counter—another journey after the original journey has already failed.

Our prototype turns that fragmented process into one guided mobile journey. The citizen uses a synthetic ticket image or enters its details manually. An OpenAI model first rejects unrelated images, then extracts only printed fields and marks anything unclear or missing. The citizen can edit every value and must confirm the critical identifiers; fixed product rules—not AI—then check a simulated Railway cancellation record, ticket type and duplicate-claim ledger. Ownership is verified using a mock OTP sent to the booking mobile, followed by a synthetic UPI or bank payout and an auditable refund tracker.

The main citizen journey works end to end. Unrelated uploads are rejected without advancing, unreadable fields can be corrected manually, critical identifiers require citizen confirmation, and duplicate protection is visible before the mocked payout begins. All tickets, railway responses, OTPs, identities and payments are synthetic and clearly labelled.

Ticket Wapas is simpler because it keeps the citizen in one bilingual, mobile-first flow; safer because eligibility is deterministic and claims are locked before payment; and more resilient because every automated step has an honest manual or assisted fallback.

## Two-minute video script

### 0:00–1:00 — citizen demonstration

- **0:00–0:08:** “I bought this ticket at a railway counter. My train was cancelled, but getting the refund can still mean returning to a PRS counter.”
- **0:08–0:19:** Open Ticket Wapas and choose the synthetic sample ticket. Point out that the image is not stored.
- **0:19–0:31:** Confirm the extracted PNR, train, date, route and fare. Say: “AI reads; rules decide.”
- **0:31–0:42:** Show the simulated cancellation, counter-ticket and duplicate checks.
- **0:42–0:51:** Fill the visible demo OTP and select the synthetic UPI destination.
- **0:51–1:00:** Start the refund and simulate payment confirmation. End on the paid state, UTR and idempotency key.

### 1:00–2:00 — how and why

- **1:00–1:14:** Explain the real gap: automatic e-ticket refunds versus a physical return journey for some counter-ticket cases.
- **1:14–1:29:** Show the architecture: OpenAI structured ticket extraction, deterministic eligibility, ownership verification, claim lock, payment adapter and audit trail.
- **1:29–1:42:** Return to ticket capture and show that an unrelated image is rejected without advancing, with clear retry and manual-entry choices.
- **1:42–1:52:** Explain safety: synthetic data, no government APIs, no official branding, server-only API key and no stored ticket image.
- **1:52–2:00:** “Ticket Wapas shows how a refund can move to the passenger, instead of making the passenger travel for the refund.”

## Final submission checklist

- [x] Public browser link that requests no access — <https://ticket-wapas.ticket-wapas-ashmita41.workers.dev/>
- [ ] Video is 2:00 or shorter and follows the 1-minute/1-minute structure
- [x] Project summary is below 250 words
- [x] No login is required; no mock credentials are needed
- [x] All links and the complete citizen journey work
- [x] Mock systems and synthetic data are disclosed
- [ ] Add partner’s registered email, or leave blank if solo
- [ ] Submit before **28 August 2026, 8:00 PM IST**

## Requirement audit

| Brief requirement | Prototype evidence | Status |
|---|---|---|
| One clearly defined problem | Cancelled-journey refund for a physical PRS counter ticket | Meets |
| Complete citizen journey | Capture → editable confirmation → eligibility → ownership → payout → editable final review → tracking | Meets |
| Simpler than the current experience | One guided flow with plain-language decisions, visible progress and recovery at every input failure | Meets |
| Indian users and mobile | Bilingual public-service header; single-column phone forms; native date picker; large controls; manual fallback | Meets |
| Synthetic sensitive dependencies | Ticket, OTP, Railway status, identity and payment data are synthetic | Meets |
| Meaningful Codex/OpenAI use | Codex-built product; server-side structured ticket extraction using an OpenAI model | Meets |
| Working, not static | The complete citizen flow works; unrelated uploads and invalid ticket fields stop safely with clear recovery | Meets |
| Backend and process thinking | Deterministic rules, idempotency lock, state transitions, retry and audit references | Meets |
| Honest limitations | Government-service familiarity without official logos; persistent independent-prototype and mock-system labels | Meets |
| No unsafe government-system access | No scraping, live government calls or undocumented APIs | Meets |
| Public submission URL | Public Cloudflare deployment requiring no login or access request | Meets |
| Two-minute video | Script is ready; recording still required | **Does not yet meet** |
