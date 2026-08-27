# Ticket Wapas — edge cases and judge cross-questions

## Product boundary judges should hear first

Ticket Wapas solves one narrow problem: **a citizen bought a physical railway counter ticket, Railways did not provide the booked service, and the citizen needs the correct refund path without another avoidable station visit**.

The video uses a fully cancelled reserved PRS counter ticket. The prototype also proves that a general/unreserved UTS counter ticket is not falsely treated as a PNR ticket. It does not claim that every railway-refund exception can be paid automatically.

Use these four labels consistently:

- **Covered now** — a reviewer can complete or trigger it in the prototype.
- **Safe stop** — the prototype refuses to guess and gives a recovery route.
- **Production integration** — the UX is designed, but an authorised Railway/payment/identity service is required.
- **Out of MVP** — a valid railway case that needs a different claim journey.

## 1. Ticket capture and data quality

| Edge case | Correct citizen outcome | Coverage | Video relevance |
|---|---|---|---|
| A selfie, food photo, screenshot or unrelated document is uploaded | Do not advance; explain that a counter-ticket image is required; allow retry/manual entry | Covered now: server returns `NOT_COUNTER_TICKET` | Mention as tested; do not spend video time |
| An IRCTC e-ticket is uploaded | Explain that the problem is already handled through the e-ticket channel; do not create this claim | Safe stop; classification must distinguish e-ticket from counter ticket in production | Judge Q&A |
| Image is blurred, cropped, dark, reflective or low resolution | Extract only readable fields, mark uncertain/missing values and require correction | Covered now: abstention plus manual route | Briefly point out editable fields |
| File is too large | Compress on device before upload; reject unsupported/unsafe files with a recoverable message | Covered now for normal phone images; platform hard limit still applies | Judge Q&A |
| Unsupported file type, corrupt file or empty upload | Do not call the model; show accepted formats and retry | Safe stop | Test before recording |
| Two tickets appear in one photo | Ask for one ticket at a time; never choose one silently | Production hardening | Judge Q&A |
| Ticket type is ambiguous | Ask whether it has a 10-digit PNR or 10-character UTS number; do not invent either | Covered through editable PRS/UTS classification and manual entry | Show UTS sample only if asked |
| AI is unavailable, times out or rate-limited | Preserve the journey and offer manual entry | Covered now: 503/manual fallback | Strong resilience answer |
| AI reads a wrong digit | Citizen must see and confirm PNR/UTS number, train, date and route before lookup | Covered now | Point to editable confirmation |
| Date is missing, impossible or future-dated | Block continuation with a field-level date error | Covered now with native date input and validation | Reviewer may test manually |
| Route stations are missing or identical | Require valid boarding/destination values; production also resolves official station codes | Partly covered; production hardening for identical/canonical codes | Judge Q&A |
| Ticket is torn or mutilated | Do not auto-refund unless authenticity can be verified | Safe stop/assisted review | Judge Q&A |
| Original ticket is lost | Do not auto-refund under published lost-ticket rules | Safe stop | Important fraud answer |

## 2. PRS reserved-ticket rules

| Edge case | Correct decision | Coverage |
|---|---|---|
| Train is finally marked fully cancelled by Railways | Full refund within the published surrender window, after ticket/duplicate/ownership checks | Covered with a signed synthetic scenario |
| Cancellation is announced, then train is restored | Do not pay while events conflict; final authorised status controls | Production integration/manual hold |
| Train is more than three hours late and passenger does not travel | Full refund only within the rule window and using actual-departure data | Out of main MVP; separate deterministic rule |
| Passenger simply missed an operating train | Not eligible through this disruption journey | Safe stop |
| Train is diverted away from boarding or destination | Use exceptional-refund/TDR rules; do not force it into “fully cancelled” | Out of MVP/assisted route |
| Train terminates short or journey is disrupted after it begins | Calculate only the unused portion and account for alternative transport/certificates | Out of MVP/manual claim |
| Railway cannot provide reserved accommodation | Apply the published full-refund window using final accommodation status | Production integration |
| AC failed or passenger travelled in a lower class | Difference-of-fare claim with staff certificate, not this full-refund flow | Out of MVP |
| Tatkal/Premium Tatkal was voluntarily cancelled | Normally no refund | Safe stop |
| Tatkal train itself is cancelled | Disruption exception may allow full refund; quota does not override the event | Production rule |
| RAC/WL later becomes confirmed | Apply confirmed-ticket rules using final chart status | Production rule |
| Some people on one PNR travel and others do not | Do not send the whole amount to one person automatically; use party/partial rules | Manual review |
| Duplicate/circular/foreign-tourist/cluster or special-product ticket | Detect product code and route to the published special process | Production catalogue/safe stop |
| Deadline has passed | Explain the exact cut-off and whether an exceptional claim is still possible; never show false eligibility | Production rule |
| Refund already exists, is pending or was paid | Show the existing reference/status; do not create a second payout | Designed and visible; production requires PRS/refund-ledger check |

## 3. UTS general/unreserved tickets

| Edge case | Correct citizen outcome | Coverage |
|---|---|---|
| Ticket has no PNR or reserved seat | Use the 10-character UTS number and never ask for a booking-mobile OTP | Covered now |
| Train-specific UTS ticket is affected by the sole practical service cancellation | Use UTS special-cancellation rules and competent-authority control | Covered as a clearly synthetic sample |
| Ordinary route ticket still has an alternate valid service | Do not assume a refund because one train was cancelled; check the route/service conditions | Safe review reference; no payout |
| Same-day ordinary ticket is presented outside the cancellation window | Apply UTS timing and clerkage rules; do not promise full refund | Production rule |
| Advance UTS ticket is cancelled after the permitted deadline | Decline or route to an authorised exception | Production rule |
| Partial cancellation for a group | Recalculate passengers/fare and preserve original-ticket control | Manual/production rule |
| Rules or supervisory approval differ by zone/circular | Use a versioned zone/rule catalogue and local approval, never one national hard-coded assumption | Production integration |
| UTS ticket is duplicated, lost or already cancelled | Block it using the UTS ledger and original-ticket controls | Production integration |

## 4. Ownership, fraud and consent

| Edge case | Safe design response | Coverage |
|---|---|---|
| PRS booking mobile exists | Send OTP only to the booking mobile; mask the number | Mocked end to end |
| Booking mobile is old/unavailable | Do not use a new number as proof; create an assisted-verification reference | Covered now |
| UTS counter ticket has no booking mobile | Use current possession plus an authorised cancellation write; never invent an OTP | Covered in synthetic UTS journey |
| Wrong, expired or repeatedly guessed OTP | Block, expire, rate-limit and offer recovery | Wrong-code block covered; expiry/rate limits are production controls |
| A PNR is known by someone else | PNR alone is not ownership; require booking-mobile/original-ticket proof | Covered conceptually |
| Photo of somebody else’s ticket is replayed | Require a fresh one-time possession photo plus authorised ledger cancellation | Mocked UX; production anti-replay needed |
| Citizen edits details after consent | Clear consent and require fresh confirmation | Covered now |
| Consent is pre-ticked | Never; the citizen must actively agree | Covered now |
| Button is tapped twice or the network retries | One claim per ticket/journey/type; return the existing status | UX explains it; production idempotency/ledger required |
| Shared/public phone is used | Mask personal/payment details, use short sessions and clear sign-out | Masking/sign-out covered; expiry production |
| Multi-passenger cash ticket | Use an approved lead-claimant rule; partial/minor/deceased/disputed cases go to review | Production policy needed |
| Name differs between passenger and destination account | Do not auto-pay; offer original source or assisted review | Production bank/name validation |
| Aadhaar/PAN/password/PIN is requested | Never request these in this prototype or over support | Covered in safety copy |

## 5. Original paper ticket and duplicate prevention

The present published process requires surrender of the original paper ticket. A photo by itself does not legally replace it. Ticket Wapas demonstrates a **proposed Railway-authorised digital surrender**:

1. citizen shows present possession using a fresh photo;
2. authorised PRS/UTS integration atomically marks the record cancelled;
3. the record blocks travel and any second refund;
4. a digital surrender receipt is issued;
5. payment begins only after that final write succeeds.

| Failure | Required response |
|---|---|
| Photo passes but authorised cancellation write fails | Do not pay; keep claim pending/retryable |
| Cancellation write succeeds but response is lost | Read the authoritative state using the same claim key; do not repeat the write |
| Cancellation status and refund ledger disagree | Freeze payout and send to reconciliation/manual review |
| Citizen finds the paper after digital cancellation | It is no longer a valid travel/refund instrument; receipt proves the action |
| Phone closes after surrender | Citizen signs in later and resumes the same claim |

## 6. Refund destination and transfer

| Edge case | Correct response | Coverage |
|---|---|---|
| Counter booking was paid by card/POS/UPI | Prefer the original source and never refund it in cash | Production integration |
| Counter booking was cash | Allow a Railway-approved verified bank/UPI destination | Synthetic choice shown |
| Original source is closed or rejects the refund | Do not silently reroute; ask for verified alternative/assisted review | Production rule |
| Payment method is missing from PRS | Do not infer it from the paper ticket | Manual review |
| UPI ID or bank account cannot be validated | Block confirmation and explain how to correct it | Mock validation shown; production adapter required |
| Transfer times out with unknown result | Show “processing,” reconcile by reference, and never ask the citizen to trigger payment again | UX now reflects automatic processing |
| Gateway sends the callback twice | Idempotently record one payment | Production backend control |
| Transfer fails definitively | Keep the approved claim, preserve ticket cancellation, and retry only the payout | Production recovery |
| Refund amount changes during final check | Show the recalculation and ask for fresh consent | Production rule/re-consent |
| Fee is added | For the showcased full-cancellation case, show ₹0 fee; do not hide any real deduction in other cases | Covered for main case |
| Citizen asks why they must “pay” | They do not—the product sends a refund after final consent | Covered now; ambiguous CTA removed |

## 7. Device, accessibility and low-connectivity cases

| Edge case | Design response | Coverage |
|---|---|---|
| 320–390 px phone | Single-column journey, large actions, no sideways scroll | Covered/tested at 390 px; test 320 px before recording |
| Slow upload | Compress on device, show reading state, retain a manual path | Covered |
| Network drops after confirmation | Claim state must resume from server; status should not encourage a second submission | UX designed; production persistence required |
| Page is refreshed mid-journey | Production should persist a short-lived draft; current demo restarts safely | Known prototype limit |
| JavaScript or storage is blocked | Main service still renders; completed demo status may fall back to sample history | Graceful demo fallback |
| Hindi is chosen | Inputs, errors, decisions and safety messages change—not just the header | Covered in main and status journeys |
| Screen reader/keyboard user | Semantic labels, native inputs, focus states, status announcements | Implemented foundation; formal assistive-tech audit remains |
| Limited digital confidence | One question per screen, plain words, examples and visible recovery | Covered |
| No smartphone or data | Assisted counter/139/help route remains necessary | Product operating-model requirement |

## 8. Operational and authority exceptions

| Edge case | Required operating control |
|---|---|
| Unauthorised staff opens the queue | Role-based authentication; default-deny permissions |
| Staff sees unnecessary personal data | Mask by default and reveal only with audited purpose |
| Two officers act on one claim | Atomic status transition and version conflict handling |
| Rules change after submission | Store the rule/version/source used for the decision |
| Queue or Railway event data is stale | Show source timestamp and prevent automatic approval |
| Manual review exceeds service window | Citizen sees a clear status, next update time and grievance route |
| Fraud pattern spans multiple tickets/accounts | Risk review may hold payment, but the citizen must receive a reason and appeal path |
| Payment reconciliation fails | Finance/railway ledger exception queue; never mark paid without confirmation |
| Large outage/disaster cancellation | Queue safely, prioritise authoritative final events and communicate delays |
| Support is contacted | Ask only for the claim reference; never ask for OTP/PIN/password |

## Judge cross-questions — direct answers

**Why is this needed if IRCTC already cancels counter tickets online?**  
The current route can mark some reserved counter tickets cancelled, but the published procedure still requires the original paper ticket to be surrendered at a PRS counter to collect the refund. Ticket Wapas removes that second physical trip through a proposed authorised digital-surrender write.

**Is this only for PNR tickets?**  
No. PRS reserved counter tickets use a 10-digit PNR and may have a booking mobile. UTS general/unreserved tickets use a 10-character UTS number, have no reserved seat and cannot be forced through a PNR/OTP flow.

**How do you know the train was really cancelled?**  
The prototype uses a signed synthetic response. Production needs an approved PRS/CRIS event and refund-state gateway, with source, timestamp and version; conflicts or restoration hold the claim.

**Why use AI? Why not OCR?**  
AI is limited to classifying the document and extracting printed fields from messy photographs. The citizen confirms them. Eligibility, amount, duplicate protection and payout are deterministic rules and authoritative-system decisions.

**What stops someone uploading any image?**  
The route classifies the document before advancing, rejects unrelated images, abstains on thin evidence and always offers manual correction. Manual entry still does not bypass the later authoritative checks.

**Is a ticket photo legally enough to surrender the original?**  
No. The photo is possession evidence only. The proposed production control is an authorised, irreversible PRS/UTS cancellation write plus a refund-ledger lock and receipt. Railway approval and process change are required.

**What if there is no phone number on the offline ticket?**  
The number is not read from the printed ticket. For PRS, an OTP is sent only if the booking record has a mobile. If unavailable, the flow creates assisted verification. For UTS, no booking-mobile OTP is used.

**How do you know whom to pay?**  
Original electronic source is preferred when present. Cash-paid tickets need a Railway-approved verified UPI/bank destination and claimant rule. Name mismatch, groups, minors, deceased or disputed ownership go to review.

**Can the same ticket be refunded twice or still used to travel?**  
Not after the proposed authorised digital-surrender transaction: the ticket state and refund claim are atomically locked, and repeated requests reopen the same reference.

**What if the payment times out?**  
The citizen sees “processing.” The system reconciles the same payment reference and never asks them to “pay” or create a second refund. A failed payout can be retried without cancelling the ticket again.

**Why does the prototype feel official?**  
It uses familiar Indian public-service hierarchy, bilingual content, accessibility and sourced rules to build trust, but uses no government emblem/Railway logo and discloses that it is an independent synthetic prototype.

**What is mocked?**  
Tickets, PNR/UTS/train status, booking mobile/OTP, identity and bank-name checks, authorised digital surrender, refund ledger and transfer. The OpenAI image route is real when configured, server-side, and stores no response.

**What would you need to launch?**  
Railway Board/CRIS approval; authorised PRS and UTS read/write/refund-ledger contracts; final event semantics; payment-source and payout rails; approved ownership/group rules; zone rule catalogue; security/privacy/accessibility audits; grievance and operations processes.

**What is the strongest proof this is more than screens?**  
The citizen completes capture, editable confirmation, eligibility, ownership, surrender, destination, active consent, payout and persistent status; invalid images, missing mobile and ordinary UTS ambiguity stop on different safe paths.

## Recording gate

Before recording, demonstrate only the strongest citizen path. Keep this matrix open for Q&A, not inside the product UI. The final preflight must confirm:

- fresh browser storage;
- 390 × 844 viewport, then a quick 320 px overflow check;
- no console errors;
- PRS sample reaches paid state without a second “payment” action;
- consent is initially unchecked and clears after editing;
- `/status` reopens the same paid claim, amount, route and selected destination;
- wrong OTP remains blocked;
- UTS sample never asks for PNR/mobile OTP;
- unrelated image remains on capture with a clear recovery action;
- Hindi main path has no clipped controls;
- disclosure is present once in the footer, not as a repeated warning.
