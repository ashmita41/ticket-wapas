# Ticket Wapas

A competition prototype for remote refunds when an Indian railway paper counter-ticket journey is cancelled by Railways. It distinguishes reserved PRS tickets from unreserved/general UTS tickets instead of forcing every citizen to enter a PNR.

The product demonstrates ticket capture, automatic PRS/UTS classification, field confirmation, rules-based eligibility, ticket-possession verification, payout selection and refund tracking. The synthetic train-specific UTS sample completes the special-cancellation journey without inventing a booking-mobile OTP; an ordinary route-based UTS ticket is safely sent for an alternate-service check.

The primary refund journey remains login-free. Citizens can optionally use the sample sign-in at `/status` to reopen refund history. A separate `/authority` dashboard uses a prefilled sample officer login before showing how authorised staff could view applications and statuses, without placing an admin panel inside the citizen journey. The `/service-information` page explains PRS and UTS tickets, the end-to-end process, the paper-ticket gap and the official sources behind the concept.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Optional AI ticket reader

The sample-ticket flow works without an API key. To enable real JPG/PNG/WEBP field extraction, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` there. The key is read only in the server route and must never be placed in browser code or committed.

The extraction route uses the OpenAI Responses API with image input, a strict JSON schema, and `store: false`. AI reads printed fields only; deterministic product rules decide cancellation eligibility, identity requirements, duplicate protection, and the refund amount.

## Demo scenarios

- Happy path: eligible ticket through simulated payment confirmation
- Duplicate claim: second payout blocked by idempotency key
- Train operating: ineligible without creating a claim
- No booking mobile: assisted-verification path
- General/UTS ticket: uses its alphanumeric UTS number and original-ticket possession, never a PNR or booking mobile
- Unreadable ticket: manual correction before lookup
- Payment retry: locked claim survives gateway timeout
- Returning citizen: sample mobile + demo OTP opens refund history and detailed status
- Authority operations: use the prefilled sample officer login, filter the application queue, inspect masked details and sign out

All ticket, OTP, identity, Railway and payment data is synthetic. A concise disclosure appears in the footer, while the service-information page documents the process and production integrations without interrupting the citizen journey with repeated technical notices.

The research and competition plan is in `docs/ticket-wapas-winning-plan.md`.
