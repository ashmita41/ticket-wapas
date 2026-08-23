# Ticket Wapas

A competition prototype for remote refunds when an Indian railway PRS counter-ticket journey is cancelled by Railways.

The product demonstrates the full citizen journey: ticket capture, field confirmation, deterministic eligibility, ownership verification, payout selection, duplicate-safe claim creation, and refund tracking. Six judge-ready scenarios cover the happy path and the failure states that make the concept credible.

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
- Unreadable ticket: manual correction before lookup
- Payment retry: locked claim survives gateway timeout

All ticket, OTP, identity, railway, and payment data in the prototype is synthetic and explicitly labelled as simulated.

The research and competition plan is in `docs/ticket-wapas-winning-plan.md`.
