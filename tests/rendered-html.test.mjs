import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

const env = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};
const context = { waitUntil() {}, passThroughOnException() {} };

function extractedTicket(overrides = {}) {
  return {
    documentType: "prs_counter_ticket",
    documentConfidence: "high",
    documentNotes: "Visible synthetic PRS counter ticket layout and fields.",
    pnr: "2468135790",
    utsNumber: null,
    trainNumber: "12424",
    trainName: "Rajdhani Express",
    date: "2026-08-24",
    origin: "New Delhi",
    destination: "Dibrugarh",
    passengers: 2,
    fare: 4860,
    mobile: null,
    confidence: {
      pnr: "extracted",
      utsNumber: "missing",
      trainNumber: "extracted",
      date: "extracted",
      origin: "extracted",
      destination: "extracted",
      fare: "extracted",
    },
    ...overrides,
  };
}

function extractedUtsTicket(overrides = {}) {
  return {
    documentType: "uts_counter_ticket",
    documentConfidence: "high",
    documentNotes: "Visible synthetic unreserved UTS counter ticket and fields.",
    pnr: null,
    utsNumber: "UTS7A4K219",
    trainNumber: "12056",
    trainName: "Jan Shatabdi",
    date: "2026-08-24",
    origin: "New Delhi",
    destination: "Dehradun",
    passengers: 1,
    fare: 165,
    mobile: null,
    confidence: {
      pnr: "missing",
      utsNumber: "extracted",
      trainNumber: "extracted",
      date: "extracted",
      origin: "extracted",
      destination: "extracted",
      fare: "extracted",
    },
    ...overrides,
  };
}

async function withMockOpenAI(output, callback) {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-server-only-key";
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://api.openai.com/")) {
      return Response.json({ output_text: JSON.stringify(output) });
    }
    return originalFetch(input, init);
  };
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
}

function syntheticUpload(clientId) {
  const form = new FormData();
  form.set("ticket", new File(["synthetic-image"], "ticket.png", { type: "image/png" }));
  return new Request("http://localhost/api/extract-ticket", {
    method: "POST",
    headers: { "x-forwarded-for": clientId },
    body: form,
  });
}

test("server-renders the Ticket Wapas prototype", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Ticket Wapas/);
  assert.match(html, /Refund for a paper railway ticket/);
  assert.match(html, /Start refund journey/);
  assert.match(html, /Original paper ticket/);
  assert.match(html, /CITIZEN REFUND SERVICE/);
  assert.match(html, /Service information/);
  assert.match(html, /Guided citizen service/);
  assert.match(html, /Independent prototype using synthetic data/i);
  assert.match(html, /Not affiliated with Indian Railways, IRCTC or the Government of India/);
  assert.doesNotMatch(html, /Independent prototype · Synthetic data only · No real refund/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("server-renders a citizen sign-in for later refund tracking", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/status", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Sign in to track your refund/);
  assert.match(html, /Use sample number 98765 42714/);
  assert.match(html, /No password is needed/);
  assert.match(html, /CITIZEN REFUND ACCOUNT/);
  assert.match(html, /Send one-time code/);
  assert.match(html, /do not enter your real mobile number/i);
});

test("server-renders the separate authority operations queue", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/authority", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Refund applications/);
  assert.match(html, /REFUND OPERATIONS/);
  assert.match(html, /View-only access/);
  assert.match(html, /TW-UTS-HELP-219/);
  assert.match(html, /NEEDS REVIEW/);
  assert.match(html, /Masked destination only/);
  assert.match(html, /Role permissions/);
});

test("server-renders public service details with process and sources", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/service-information", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /How the counter-ticket refund journey works/);
  assert.match(html, /7\.18 crore/);
  assert.match(html, /11% of 65\.08 crore/);
  assert.match(html, /booking volume, not the number of cancellations or refund claims/i);
  assert.match(html, /RESERVED · PRS/);
  assert.match(html, /GENERAL \/ UNRESERVED · UTS/);
  assert.match(html, /Railway and Government sources/);
  assert.match(html, /Ministry of Railways source/);
});

test("keeps secrets server-side and ships the social preview", async () => {
  const [page, route, client] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/extract-ticket/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/ticket-wapas.tsx", import.meta.url), "utf8"),
    access(new URL("public/og-ticket-wapas.png", root)),
  ]);

  assert.match(page, /og-ticket-wapas\.png/);
  assert.match(route, /process\.env\.OPENAI_API_KEY/);
  assert.match(route, /store:\s*false/);
  assert.match(route, /json_schema/);
  assert.match(route, /NOT_COUNTER_TICKET/);
  assert.match(route, /documentType/);
  assert.doesNotMatch(client, /OPENAI_API_KEY|Bearer sk-/);
  assert.match(client, /We check for an existing refund first/i);
  assert.match(client, /Every field is editable, and you stay in control/i);
  assert.match(client, /type="date"/i);
  assert.match(client, /I checked the PNR, train number and journey date/i);
  assert.match(client, /Edit ticket details/i);
  assert.match(client, /I no longer have access to this number/i);
  assert.match(client, /ASSISTED VERIFICATION/i);
  assert.match(client, /HELP REFERENCE TW-HELP-2714/i);
  assert.match(client, /Take or upload ticket photo/i);
  assert.match(client, /UNRESERVED UTS · SYNTHETIC/i);
  assert.match(client, /Unreserved UTS ticket found/i);
  assert.match(client, /This ticket has a UTS number instead of a PNR/i);
  assert.match(client, /UTS SPECIAL CANCELLATION/i);
  assert.match(client, /No booking-mobile OTP used/i);
  assert.match(client, /UTS CANCELLATION RECEIPT TW-UTS-824/i);
  assert.match(client, /One more check is needed/i);
  assert.match(client, /UTS REFERENCE TW-UTS-HELP-219/i);
  assert.match(client, /No refund was started/i);
  assert.match(client, /href="\/status"/i);
  assert.match(client, /Authority view/i);
  assert.match(client, /How we check a refund/i);
  assert.match(client, /DIGITAL TICKET SURRENDER/i);
  assert.match(client, /Take a one-time surrender photo/i);
  assert.match(client, /Cancel ticket digitally/i);
  assert.match(client, /DIGITAL SURRENDER RECEIPT TW-DS-824/i);
  assert.doesNotMatch(client, /Authorised pickup|PRS counter handover|TW-HO-824/i);
  assert.match(client, /Cash at PRS counter/i);
  assert.match(client, /Independent prototype using synthetic data/i);
  assert.equal((client.match(/Independent prototype using synthetic data/g) ?? []).length, 1);
  assert.doesNotMatch(client, /Independent prototype · Synthetic data only · No real refund/i);
  assert.doesNotMatch(client, /home-visual|ticket-stub|CLEAR NEXT STEP|SERVICE OVERVIEW/i);
  assert.match(client, /अब यह नंबर मेरे पास नहीं है/);
  assert.match(client, /रिफंड शुरू करने के लिए तैयार/);
  assert.doesNotMatch(client, /JUDGE CONTROLS|Test the real edge cases|Demo: Happy path|judge-ready/i);
  assert.doesNotMatch(client, /Idempotency key|tokenised|claim key|payment rail|Deterministic eligibility|fixed product rules|PNR \+ journey \+ claim type/i);
});

test("returns a safe manual fallback when AI extraction is not configured", async () => {
  const app = await worker();
  const form = new FormData();
  form.set("ticket", new File(["synthetic"], "ticket.png", { type: "image/png" }));
  const response = await app.fetch(new Request("http://localhost/api/extract-ticket", { method: "POST", body: form }), env, context);

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    code: "AI_UNAVAILABLE",
    message: "Ticket reader is not configured. Continue with manual entry.",
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("rejects an unrelated image instead of advancing the citizen journey", async () => {
  const app = await worker();
  const result = await withMockOpenAI(extractedTicket({
    documentType: "not_ticket",
    documentNotes: "A landscape image with no ticket.",
    pnr: null,
    utsNumber: null,
    trainNumber: null,
    trainName: null,
    date: null,
    origin: null,
    destination: null,
    passengers: null,
    fare: null,
    confidence: {
      pnr: "missing",
      utsNumber: "missing",
      trainNumber: "missing",
      date: "missing",
      origin: "missing",
      destination: "missing",
      fare: "missing",
    },
  }), () => app.fetch(syntheticUpload("test-not-ticket"), env, context));

  assert.equal(result.status, 422);
  assert.deepEqual(await result.json(), {
    code: "NOT_COUNTER_TICKET",
    message: "This image does not look like a physical railway counter ticket. Upload a clear synthetic counter-ticket image or enter the details manually.",
  });
});

test("accepts a classified ticket only when enough visible ticket evidence is present", async () => {
  const app = await worker();
  const result = await withMockOpenAI(extractedTicket(), () => app.fetch(syntheticUpload("test-valid-ticket"), env, context));

  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.ticket.documentType, "prs_counter_ticket");
  assert.equal(body.ticket.date, "2026-08-24");
  assert.equal(body.stored, false);
});

test("accepts a classified unreserved UTS counter ticket without a PNR", async () => {
  const app = await worker();
  const result = await withMockOpenAI(extractedUtsTicket(), () => app.fetch(syntheticUpload("test-valid-uts-ticket"), env, context));

  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.ticket.documentType, "uts_counter_ticket");
  assert.equal(body.ticket.utsNumber, "UTS7A4K219");
  assert.equal(body.ticket.pnr, null);
  assert.equal(body.stored, false);
});

test("abstains when a ticket classification has too little readable evidence", async () => {
  const app = await worker();
  const result = await withMockOpenAI(extractedTicket({
    pnr: null,
    utsNumber: null,
    trainNumber: null,
    origin: null,
    destination: null,
    fare: null,
    confidence: {
      pnr: "missing",
      utsNumber: "missing",
      trainNumber: "missing",
      date: "extracted",
      origin: "missing",
      destination: "missing",
      fare: "missing",
    },
  }), () => app.fetch(syntheticUpload("test-thin-evidence"), env, context));

  assert.equal(result.status, 422);
  assert.equal((await result.json()).code, "TICKET_UNCLEAR");
});
