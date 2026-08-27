# Ticket Wapas — Winning Prototype Plan

Date: 23 August 2026
Submission deadline: 28 August 2026, 8:00 PM IST
Internal submission target: 28 August 2026, 5:00 PM IST

## 1. Decision

Build Ticket Wapas as an independent, mobile-first hackathon prototype for one specific case:

> A passenger supplied a mobile number while buying a PRS counter ticket. Indian Railways later cancelled the train. The passenger should be able to verify the ticket and receive the eligible refund digitally without travelling to a reservation counter to surrender the paper ticket.

The prototype must not expand into regular passenger cancellations, delayed-train TDRs, waitlist prediction, ticket booking, or general railway complaints.

## 2. Research finding

This is a current, documented service gap rather than a hypothetical inconvenience.

- Indian Railways reported 65.08 crore reserved-ticket bookings from June 2025 to June 2026. Of these, 7.18 crore (11%) were counter bookings.
- The Ministry of Railways stated on 12 August 2026 that cancelled e-tickets receive automatic refunds, while counter-ticket passengers must visit the nearest PRS counter.
- The existing online counter-ticket page uses PNR, train number, CAPTCHA and an OTP sent to the booking mobile. It can mark an ordinary ticket as cancelled, but the passenger must still surrender the original ticket at a PRS counter to collect the refund.
- The same page explicitly excludes late-running and railway-cancelled trains from its online flow.
- The current IRCTC refund document allows a ticket for a cancelled train to be cancelled at a computerised reservation counter for up to 72 hours after scheduled departure.

This creates a clear disparity:

| E-ticket after railway cancellation | PRS counter ticket after railway cancellation |
| --- | --- |
| Automatic refund to original account | Passenger visits a PRS counter and surrenders paper ticket |

Important evidence boundary: 7.18 crore is the number of counter bookings, not the number of cancelled tickets or refund claims. We must not imply otherwise.

## 3. Why this can score highly

### Problem

- The founder has personally faced the problem multiple times, satisfying the lived-experience requirement.
- The citizen loses additional time and travel cost because the public service cancelled the journey.
- The inequality is instantly understandable without specialised knowledge.

### Working build

- Reviewers can complete the primary flow themselves using a preloaded synthetic ticket.
- No government login, real PNR, real OTP or real payment is required.
- Every feature shown in the submission video will be interactive.

### Usability

- Camera/upload-first, with manual PNR and train-number fallback.
- Designed first for a 360 px mobile screen.
- Large touch targets, short sentences, visible progress and Hindi/English support.
- A low-bandwidth path works without uploading an image.

### Product thinking

- OpenAI vision extracts ticket fields into a strict schema, but the citizen confirms every critical value.
- A deterministic eligibility rule—not an AI model—decides whether the mock refund is allowed.
- The experience handles unreadable tickets, missing booking mobile numbers, duplicate claims and payment failure honestly.

### End-to-end thinking

- The prototype represents PRS verification, train-cancellation verification, OTP, claim locking, payout, status tracking and notification.
- The production concept explains how the paper ticket can be invalidated digitally and how double refunds are prevented.

### Honesty

- One restrained footer disclosure says that this is an independent prototype using synthetic data, with no real Railway system or refund connected.
- Sample tickets, mobile numbers and OTPs are labelled where citizens interact with them; the dedicated Service information page documents integration boundaries and sources without repeating technical warnings in every step.

## 4. Product promise

### Citizen-facing promise

> Train cancelled? Verify your counter ticket and start your refund without another station visit.

Do not promise “instant money.” The honest success message is “Refund initiated,” followed by a simulated tracking state.

### Main user

- Holds an original PRS counter ticket.
- Supplied a valid mobile number at booking.
- The railway—not the passenger—cancelled the train.
- Wants the refund through a verified digital payout method.
- May use a low-cost Android phone, a slow connection and limited English.

### Non-users in version one

- A ticket without a booking-linked mobile number.
- Ordinary voluntary cancellation.
- Late, diverted or partially terminated trains.
- Partially travelled journeys.
- Lost tickets, concessions, passes and group exceptions.
- Refund appeals or disputed railway decisions.

These cases get a clear explanation, not a false “eligible” result.

## 5. Primary citizen journey

### Screen 1 — Understand

- Headline: “Train cancelled? Get your counter-ticket refund without another station visit.”
- Two actions: “Use sample ticket” and “Enter ticket details.”
- Clear independent-prototype label.
- Four-step progress preview: Ticket → Verify → Refund → Track.

### Screen 2 — Capture ticket

- Upload/photograph a synthetic ticket or use the preloaded example.
- Extract PNR, train number, journey date, origin, destination, passenger count and fare.
- Mark each extracted field as `EXTRACTED`, `UNCLEAR` or `MISSING`; never invent a value.
- Require citizen confirmation of PNR, train number and journey date even when extraction succeeds.
- Manual entry is always visible.

### Screen 3 — Verify eligibility

- Simulated PRS response: ticket exists, is a PRS counter ticket and is not already refunded.
- Simulated train-status response: “Cancelled by Railways.”
- Result: “Full fare is eligible for refund in this demo.”
- Show refund amount and why the case qualifies.

### Screen 4 — Verify booking mobile

- Explain that the OTP goes to the masked number supplied at booking.
- Provide an obvious demo OTP near the input.
- Successful verification unlocks payout selection.

### Screen 5 — Choose payout

- Use only synthetic options: a demo UPI ID or masked demo bank account.
- Let the citizen confirm the recipient name.
- Explain that a real implementation would use a tokenised payment provider and name matching; it would not store raw bank credentials.

### Screen 6 — Review and consent

- Ticket, cancellation reason, refund amount and payout destination.
- Plain-language declaration that the ticket has not already been refunded.
- Primary action: “Start refund.”

### Screen 7 — Confirmation and tracking

- Generate a synthetic refund reference.
- Mark the mock PNR as `REFUND_PENDING` so a second attempt is blocked.
- Show a short status timeline: Verified → Refund initiated → Paid.
- Simulate successful completion without implying that a real railway payment occurred.
- Provide “Download demo receipt” only if it can be implemented and tested before the video; otherwise omit it.

## 6. Prototype state machine

```text
DRAFT
  -> TICKET_CONFIRMED
  -> CANCELLATION_VERIFIED
  -> OTP_VERIFIED
  -> PAYOUT_CONFIRMED
  -> REFUND_PENDING
  -> PAID

Exception exits:
  -> MANUAL_ENTRY_REQUIRED
  -> NOT_CANCELLED
  -> MOBILE_NOT_LINKED
  -> ALREADY_CLAIMED
  -> PAYMENT_RETRY
```

The mock backend must enforce these transitions. A user cannot jump directly to payout or submit the same claim twice.

## 7. Eligibility and safety model

Eligibility should be a transparent rule:

```text
eligible =
  ticket.source == "PRS_COUNTER"
  AND train.status == "CANCELLED_BY_RAILWAYS"
  AND ticket.refundStatus == "UNCLAIMED"
  AND ticket.bookingMobileLinked == true
  AND otp.verified == true
```

AI must never make the final eligibility or refund-value decision. It may extract fields and explain the deterministic result.

### Duplicate-claim prevention

- Use `PNR + journey date + claim type` as a mock idempotency key.
- Atomically change the claim from `UNCLAIMED` to `REFUND_PENDING` before starting the mock payout.
- Reject repeated submission with the existing reference number.
- Maintain a visible synthetic audit trail.

### Production identity concept

- Possession of ticket details.
- OTP to the mobile number supplied at booking, reusing the proof already used by the current online counter-ticket service.
- Name-matched/tokenised payout destination.
- No Aadhaar requirement in the proposed flow.
- Assisted counter path remains available for passengers without a linked mobile or digital payout option.

### Privacy

- The public prototype explicitly accepts synthetic tickets only.
- Uploaded demo images should be processed transiently and not retained.
- Logs must not contain ticket images, full phone numbers, bank details or OTPs.
- A production design should prefer on-device OCR where practical and delete server-side images immediately after extraction.

## 8. Role of Codex and OpenAI API

Codex will be meaningfully involved in:

- Converting the research into product requirements and state transitions.
- Building the interface and mocked service adapters.
- Creating synthetic ticket data and exception scenarios.
- Writing automated tests and accessibility checks.
- Reviewing privacy, failure states and unsupported claims.
- Producing the deployment, demo and submission assets.

Recommended bounded in-product model use:

- Send the synthetic ticket image to a server-side OpenAI Responses API route.
- Use image input plus Structured Outputs with a JSON Schema to extract ticket fields.
- Return `null` and `MISSING` when text is absent, and `null`/`UNCLEAR` when it cannot be read reliably; never guess.
- Use `store: false` for this stateless extraction request.
- Keep the selected model configurable through `OPENAI_TICKET_MODEL`; compare a cost-conscious vision model and a stronger fallback on the same synthetic evaluation set before locking it.

Do not use the API for eligibility, refund calculations, OTP, payment decisions or live translations. Hindi copy should be fixed and human-reviewed. The main journey must remain usable through manual entry if extraction fails or times out. Do not add a generic chatbot.

### Extraction response contract

```json
{
  "document_type": "PRS_COUNTER_TICKET | NOT_A_TICKET | UNCLEAR",
  "pnr": { "value": "string | null", "status": "EXTRACTED | UNCLEAR | MISSING" },
  "train_number": { "value": "string | null", "status": "EXTRACTED | UNCLEAR | MISSING" },
  "journey_date": { "value": "YYYY-MM-DD | null", "status": "EXTRACTED | UNCLEAR | MISSING" },
  "origin": { "value": "string | null", "status": "EXTRACTED | UNCLEAR | MISSING" },
  "destination": { "value": "string | null", "status": "EXTRACTED | UNCLEAR | MISSING" },
  "passenger_count": { "value": "number | null", "status": "EXTRACTED | UNCLEAR | MISSING" },
  "fare_inr": { "value": "number | null", "status": "EXTRACTED | UNCLEAR | MISSING" },
  "warnings": ["string"]
}
```

The server must validate the model response against the same schema before returning it to the browser. A structurally valid response is not automatically factually correct; the confirmation screen remains mandatory.

### API key and abuse controls

- Never paste the key into source code, browser JavaScript, chat messages, screenshots or the repository.
- Store it as the deployment platform's server-side `OPENAI_API_KEY` secret.
- Add `.env*` to `.gitignore` and commit only a value-free `.env.example`.
- Route all model requests through `/api/extract-ticket`; the browser never calls OpenAI directly.
- Accept only JPEG, PNG or WebP; enforce a small upload limit and reject other files before the API call.
- Rate-limit by session/IP, enforce a short timeout and allow at most one safe retry.
- Return the manual-entry screen on quota, timeout, refusal, invalid schema or low-readability results.
- Set a project spend limit/alerts and use a restricted project key where available.
- Do not log image bodies, base64 data, extracted PNRs, OTPs or payout values.

### Model evaluation gate

Before enabling extraction in the final video, evaluate at least these synthetic images:

1. Clean, straight ticket.
2. Low-light phone photo.
3. Slightly rotated ticket.
4. Blurred or partly obscured ticket that should produce `UNCLEAR`/`MISSING` instead of a guess.
5. A non-ticket image that should produce `NOT_A_TICKET`.

Score exact matches for PNR, train number and journey date, plus correct abstention on unreadable fields. Promote to a stronger model only if the cost-conscious option fails this small evaluation. If neither model is reliable enough, keep “Use sample ticket” deterministic and show manual entry in the final submission.

## 9. Mock service architecture

```text
Mobile web app
  -> Server-side OpenAI ticket extraction adapter (synthetic image / manual fallback)
  -> Mock PRS adapter (ticket identity and refund state)
  -> Mock train-status adapter (railway cancellation)
  -> Mock OTP adapter
  -> Refund orchestration service
       -> idempotency / claim lock
       -> mock payment adapter
       -> audit events
       -> mock SMS notification
  -> Tracking screen
```

Recommended implementation for speed and reliability:

- React + TypeScript web app with a small explicit state machine.
- Static synthetic fixtures for tickets, train status, OTP and payments.
- Browser storage for the demo claim so refresh does not erase tracking state.
- Server-side `/api/extract-ticket` route using the OpenAI Responses API, image input and Structured Outputs.
- No API dependency after extraction; the remaining journey stays deterministic and fast.
- Automated component tests plus one browser-level happy-path test.
- Public static/serverless deployment with no reviewer access request.

## 10. Synthetic scenarios

### A. Happy path — demo this

- Synthetic PRS counter ticket.
- Train cancelled by the railway.
- Booking mobile linked.
- Unclaimed refund.
- OTP succeeds.
- Payout succeeds.

### B. Duplicate claim

- Same ticket has an existing refund reference.
- Show status instead of creating a second payout.

### C. Train still operating

- Clearly state that Ticket Wapas only handles railway-cancelled trains.
- Do not recommend a refund rule for delays or voluntary cancellation.

### D. No booking mobile

- Explain why remote verification is unavailable.
- Provide a general “counter assistance required” result without inventing a station or deadline.

### E. Unreadable image

- Preserve readable fields and mark uncertain ones as `UNCLEAR` or `MISSING`.
- Offer manual PNR and train-number entry without restarting.

### F. Payment retry

- Keep the claim locked.
- Allow retrying the synthetic payout without creating a new claim.

## 11. Design requirements

- Mobile-first at 320, 360 and 390 px widths; desktop remains polished.
- Minimum 48 px touch targets.
- Semantic labels, visible focus, keyboard completion and screen-reader announcements for status changes.
- Do not rely on red/green alone.
- English and Hindi in the first release; Kannada only after both primary languages are complete and verified.
- Plain language: “booking mobile,” not “registered MSISDN”; “refund reference,” not “transaction orchestration ID.”
- Small initial bundle, compressed/lazy-loaded sample ticket and no autoplay video.
- A manual low-bandwidth route that avoids image upload.
- Visual identity must be original. Do not use government emblems, IRCTC/Railways logos or styling that implies endorsement.

## 12. Validation targets

Before final submission:

- Five quick usability sessions using only synthetic data.
- At least four of five participants complete the happy path without help.
- Median completion time under two minutes.
- No participant mistakes the prototype for an official railway service.
- No duplicate payout can be created through refresh, back navigation or double click.
- Complete flow works with keyboard only.
- Test on Android Chrome, desktop Chrome/Edge and Safari.
- Test at slow network throttling and at 200% text zoom.
- Accessibility audit target: 95+; fix all serious issues regardless of score.
- Every link works in a signed-out/private browser window.

Suggested interview prompts:

1. “Your train was cancelled and this is a counter ticket. What would you do first on this screen?”
2. “What do you think will happen after you press Start refund?”
3. “Which parts look official or unofficial to you?”
4. “Would you trust this verification method? Why?”
5. “What would stop you from completing this without help?”

Never collect real PNRs, Aadhaar numbers, OTPs or payment details during research.

## 13. Five-day execution plan

### 23 August — Lock the story

- Finalise this scope and the seven-screen journey.
- Write interface copy before coding.
- Design the synthetic ticket and six mock scenarios.
- Choose the deployment target and confirm that a public link can be created.

### 24 August — Build the complete skeleton

- Scaffold the app and original visual system.
- Implement landing, sample/manual ticket input, field confirmation and eligibility result.
- Add the persistent prototype disclosure.
- Make the happy path work end to end with simple fixtures before adding polish.
- Add the server-only environment-variable contract without requiring the model for the first working flow.

### 25 August — Add backend thinking

- Implement OTP, payout selection, idempotent claim submission and tracking.
- Add duplicate, not-cancelled, no-mobile and unreadable-ticket states.
- Add browser persistence and audit events.
- Write unit tests for eligibility and claim transitions.

### 26 August — Make it inclusive and convincing

- Finish responsive mobile UI, keyboard support and screen-reader states.
- Add reviewed Hindi strings and low-bandwidth/manual route.
- Integrate server-side OpenAI ticket extraction and run the five-image evaluation gate.
- Keep deterministic sample loading and manual entry as fallbacks for every API failure.
- Add explicit “working vs mocked” explanation.

### 27 August — Validate and deploy

- Deploy the production build.
- Run five usability sessions and fix observed failures.
- Complete browser, accessibility, slow-network and duplicate-submission QA.
- Record a draft two-minute video and cut anything that cannot be shown working.

### 28 August — Submission buffer

- Freeze features; fix only submission blockers.
- Verify the public URL in a private window and on a phone.
- Record the final video and confirm it is under two minutes.
- Finalise the under-250-word summary and mock-data disclosure.
- Submit by the internal 5:00 PM IST target, three hours before closure.

## 14. Two-minute video plan

### Minute one — citizen journey

- 0–7s: “My train was cancelled. Because I bought at a counter, getting my refund means another station visit.”
- 7–18s: Open Ticket Wapas and select the synthetic sample ticket.
- 18–30s: Confirm extracted fields and simulated cancellation verification.
- 30–42s: Enter the visible demo OTP and choose the synthetic payout.
- 42–52s: Review and start the refund.
- 52–60s: Show the reference, paid status and duplicate-claim protection.

### Minute two — why and how

- 60–72s: Official gap and accurate scale: 7.18 crore counter bookings in one year; do not call them refund cases.
- 72–88s: Existing journey versus proposed journey.
- 88–103s: Mock PRS/train/OTP/payment architecture and deterministic eligibility.
- 103–113s: Safety, idempotency, accessibility and low-bandwidth choices.
- 113–120s: What Codex built and the production integration that remains mocked.

## 15. Submission checklist

- Live public browser link; no access request and no app download.
- Working happy path using a clearly labelled synthetic sample.
- Mock credentials/OTP visible wherever required.
- Two-minute maximum public video.
- Project summary under 250 words.
- Codex contribution described concretely.
- Open-source libraries and assets disclosed with licences.
- Independent prototype disclaimer visible once in the page footer.
- No official logo, real government data, real personal data or undocumented API.
- “What works” and “what is mocked” documented on the Service information page and in the submission.

## 16. Kill list

Do not spend the five-day window on:

- Expanding the small authority-status queue beyond what is needed to prove the end-to-end operating model.
- Waitlist prediction or alternative journey booking.
- A general railway assistant/chatbot.
- Real government integration or scraping.
- Aadhaar authentication.
- More than two complete languages before the core flow is tested.
- Complex animation, 3D visuals or a native mobile app.
- Features that will only be described rather than demonstrated.

## 17. Primary risks and responses

| Risk | Response |
| --- | --- |
| “This is only 11% of reservations” | Use the accurate absolute figure: 7.18 crore counter bookings in one year, while avoiding claims about cancellations. |
| “How can the paper ticket be trusted remotely?” | Ticket possession + booking-mobile OTP + name-matched payout + atomic PNR refund lock. |
| “Someone may collect the refund twice” | Mark the PNR `REFUND_PENDING` before payout and make submission idempotent. |
| “What about people without smartphones or linked mobiles?” | Keep the assisted counter route; do not pretend one channel serves everyone. |
| “The prototype cannot really pay” | State it clearly in the footer and Service information page; demonstrate a complete simulated integration with an auditable state machine. |
| “Why is AI needed?” | AI/OCR reduces typing; deterministic rules protect eligibility. Codex is meaningfully used across the build. |
| “What if the model misreads a PNR?” | Strict nullable schema, `UNCLEAR`/`MISSING` abstention, server validation and mandatory citizen confirmation. |
| “What if the API is down during judging?” | Preloaded deterministic sample plus manual entry; the refund journey never depends on a successful model call. |
| “How is the API key protected?” | Server-only environment secret, restricted upload route, rate limit, spend alerts and no key or image logging. |
| “Ticket photos contain personal data” | Synthetic-only prototype; transient extraction, data minimisation and deletion in the production design. |
| Scope grows into all refunds | Enforce the one-case scope and redirect every other case clearly. |

## 18. Sources

- Hackathon builder brief: https://buildwhatmovesindia.com/brief
- Hackathon FAQ: https://buildwhatmovesindia.com/faq
- Ministry of Railways, online versus counter ticket volume, 22 July 2026: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2287719&lang=1&reg=48
- Ministry of Railways, e-ticket automatic refund versus counter visit, 12 August 2026: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298355&lang=1&reg=48
- Current IRCTC counter-ticket cancellation procedure: https://www.operations.irctc.co.in/ctcan/SystemTktCanLogin.jsf
- IRCTC refund and cancellation rules dated 19 January 2026: https://contents.irctc.co.in/en/RefundCancellationRules.pdf
- OpenAI Responses API reference (image input and structured JSON output): https://developers.openai.com/api/reference/cli/resources/responses/methods/create
- OpenAI API key safety guidance: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
- Reddit example, counter cancellation still requiring counter collection: https://www.reddit.com/r/indianrailways/comments/1fj1efn/
- Reddit comparison of e-ticket and counter-ticket refund experience: https://www.reddit.com/r/indianrailways/comments/1lc1xl1/
