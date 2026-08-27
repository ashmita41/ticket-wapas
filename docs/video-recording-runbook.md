# Ticket Wapas — two-minute recording runbook

## Before recording

1. Use Chrome at 390 × 844 or record a real phone-shaped viewport.
2. Open a fresh private window so the journey begins cleanly.
3. Keep browser zoom at 100%, close DevTools and hide bookmarks/other tabs.
4. Confirm the deployed home page, PRS sample, sample OTP and `/status` all load.
5. Use the built-in **Reserved PRS · Synthetic** sample. It avoids depending on network image analysis during the recording.
6. Speak plainly. Do not narrate internal keys, tokenisation, adapters or architecture labels while the citizen is using the service.

## Exact 120-second sequence

### 0:00–1:00 — the complete citizen journey

| Time | On screen | Narration |
|---|---|---|
| 0:00–0:07 | Home; main action already visible | “When a counter-booked train is cancelled, the journey fails—but collecting the refund can still mean another station trip.” |
| 0:07–0:14 | Tap **Start refund journey**, then PRS sample | “Ticket Wapas starts with the ticket. A citizen can take a photo or enter the details.” |
| 0:14–0:23 | Editable ticket details; tick confirmation | “AI reads the paper, but never decides the refund. Every important field is editable and confirmed by the citizen.” |
| 0:23–0:31 | Eligibility screen | “Published rules check the exact train, date, final cancellation and whether a refund already exists.” |
| 0:31–0:39 | Fill sample OTP | “For this reserved ticket, ownership is checked against the booking mobile. If that number is unavailable, there is an assisted route.” |
| 0:39–0:47 | Complete synthetic digital-surrender steps | “The proposed authorised surrender makes the paper unusable and issues a receipt—the photo alone never does that.” |
| 0:47–0:54 | Choose UPI, review, actively tick consent | “The citizen sees the amount, zero fee and destination, then actively confirms once.” |
| 0:54–1:00 | Tap **Confirm and send**; paid state appears | “The refund is sent, and the citizen gets one reference—without being asked to make a payment.” |

### 1:00–2:00 — why it is credible and better

| Time | On screen | Narration |
|---|---|---|
| 1:00–1:12 | Open **Refund status**, fill sample mobile/code | “That same claim reopens later with the same route, amount, destination and paid status.” |
| 1:12–1:24 | Briefly return to ticket samples and show UTS label | “General UTS tickets are different: no PNR and no booking-mobile OTP. A train-specific special-cancellation sample follows the correct route; an ordinary route ticket stops for an alternate-service check.” |
| 1:24–1:37 | Show an editable field or capture recovery | “Unrelated or unreadable images do not move ahead. The system abstains and lets the citizen retry or enter details manually.” |
| 1:37–1:50 | Service information page | “All Railway, identity and payment responses are synthetic. Launch requires approved PRS/UTS event, cancellation and refund-ledger integrations—no live government system was accessed.” |
| 1:50–2:00 | Return to paid receipt/home | “Ticket Wapas turns a fragmented paper process into one bilingual mobile journey: the refund moves to the passenger instead of making the passenger travel for it.” |

## Recording shortcuts

- Use sample-fill buttons; never type slowly on camera.
- Scroll only enough to reveal the next primary button.
- Pause half a second on eligibility, active consent, paid reference and reopened status—the four proof moments.
- Do not show the authority dashboard in the two-minute video unless the form explicitly asks for operations evidence. Reviewers test the citizen experience first.
- If the live AI route is slow, do not upload a real image in the final take. Mention that real structured extraction is available and show the deterministic synthetic sample.

## One-take backup narration

“Ticket Wapas helps a passenger whose physical counter-ticket train was cancelled. They take a ticket photo or enter details; AI extracts printed data, the citizen confirms it, and rules check the final Railway event and duplicates. A reserved PRS ticket uses its booking mobile, while a UTS ticket never invents a PNR or OTP. A proposed authorised digital surrender cancels the paper record before a verified refund is sent. The same reference opens later in status. Unclear images, unavailable phones and ambiguous UTS cases stop safely. All government, identity and payment dependencies are synthetic here; production needs Railway Board and CRIS approval. The result is one bilingual, mobile journey instead of another station visit.”

## If a judge interrupts

- **“Is the photo enough?”** — “No. It is possession evidence; the authorised PRS/UTS cancellation write is the legal/operational control.”
- **“What if there is no mobile?”** — “PRS uses assisted verification; UTS never assumes a booking mobile.”
- **“What if payment fails?”** — “The approved claim remains processing and payout is reconciled by the same reference; the ticket is not cancelled twice.”
- **“What is AI deciding?”** — “Only document classification and field extraction. Deterministic rules and authorised state decide eligibility and money.”
- **“Does this work today?”** — “This is a complete synthetic prototype of the citizen experience; launch needs approved Railway and payment integrations listed on Service information.”
