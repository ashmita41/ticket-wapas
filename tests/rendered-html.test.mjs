import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

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
    passengers: 1,
    fare: 4860,
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

async function mockRefundService() {
  const source = await readFile(new URL("../app/mock-refund-service.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}#${Math.random()}`;
  return import(moduleUrl);
}

function memoryWindow() {
  const values = new Map();
  return {
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, String(value)); },
    },
  };
}

test("server-renders the Ticket Wapas prototype", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Ticket Wapas/);
  assert.match(html, /Train cancelled\? Get your counter-ticket refund without returning to the station/);
  assert.match(html, /Take or upload ticket photo/);
  assert.match(html, /Enter ticket details/);
  assert.match(html, /Original PRS paper ticket/);
  assert.match(html, /Booking mobile/);
  assert.match(html, /CITIZEN REFUND SERVICE/);
  assert.match(html, /Service information/);
  assert.match(html, /For a train cancelled by Railways/);
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

test("server-renders a mock authority sign-in before the operations queue", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/authority", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /REFUND OPERATIONS/);
  assert.match(html, /Sign in to refund operations/);
  assert.match(html, /refund\.officer/);
  assert.match(html, /Sign in securely/);
  assert.doesNotMatch(html, /MOCK CREDENTIALS FOR REVIEW|Use this account to test the authority journey|Fill mock credentials/);
  assert.doesNotMatch(html, /Refund applications/);
});

test("keeps the authority queue and sign-out flow behind the mock sign-in", async () => {
  const client = await readFile(new URL("../app/authority/authority-dashboard.tsx", import.meta.url), "utf8");

  assert.match(client, /useState\(false\)/);
  assert.match(client, /username:\s*"refund\.officer"/);
  assert.match(client, /password:\s*"Demo@824"/);
  assert.match(client, /Refund applications/);
  assert.match(client, /TW-UTS-HELP-219/);
  assert.match(client, /NEEDS REVIEW/);
  assert.match(client, /Masked destination only/);
  assert.match(client, /Role permissions/);
  assert.match(client, /Sign out/);
});

test("server-renders public service details with process and sources", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/service-information", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /A cancelled train should not create another station journey/);
  assert.match(html, /7\.18 crore/);
  assert.match(html, /11% of 65\.08 crore/);
  assert.match(html, /booking volume, not the number of cancellations or refund claims/i);
  assert.match(html, /PRIMARY · RESERVED PRS/);
  assert.match(html, /SEPARATE · GENERAL \/ UTS/);
  assert.match(html, /The photo is not the surrender/);
  assert.match(html, /Railway and Government sources/);
  assert.match(html, /Ministry of Railways source/);
});

test("keeps secrets server-side and ships the social preview", async () => {
  const [page, route, client, mockService] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/extract-ticket/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/ticket-wapas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/mock-refund-service.ts", import.meta.url), "utf8"),
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
  assert.match(client, /useState\(false\)/);
  assert.match(client, /Confirm ₹/i);
  assert.match(client, /refund instruction is being processed/i);
  assert.doesNotMatch(client, /Complete payment/i);
  assert.match(client, /Every field is editable, and you stay in control/i);
  assert.match(client, /type="date"/i);
  assert.match(client, /I checked the PNR, train number and journey date/i);
  assert.match(client, /Edit ticket details/i);
  assert.match(client, /I no longer have access to this number/i);
  assert.match(client, /ASSISTED REVIEW/i);
  assert.match(client, /HELP REFERENCE TW-HELP-2714/i);
  assert.match(client, /Take or upload ticket photo/i);
  assert.match(client, /Unreserved UTS ticket found/i);
  assert.match(client, /This ticket has a UTS number instead of a PNR/i);
  assert.match(client, /SEPARATE UTS ROUTE/i);
  assert.match(client, /We do not apply the PRS refund promise to them/i);
  assert.match(client, /A General \/ UTS ticket needs a different check/i);
  assert.match(client, /UTS REFERENCE TW-UTS-HELP-219/i);
  assert.match(client, /No refund was started/i);
  assert.match(client, /href="\/status"/i);
  assert.match(client, /Authority view/i);
  assert.match(client, /Fixed service rules—not AI/i);
  assert.match(client, /REMOTE SURRENDER · PROPOSED/i);
  assert.match(client, /Take a one-time possession photo/i);
  assert.match(client, /It does not by itself surrender or invalidate the paper ticket/i);
  assert.match(client, /Record remote surrender/i);
  assert.match(client, /REMOTE SURRENDER RECEIPT/i);
  assert.match(client, /A real service would need an approved PRS integration/i);
  assert.match(client, /No duplicate created/i);
  assert.match(client, /The simulated PRS record—not the ticket photo—returned/i);
  assert.match(mockService, /getPrsTicketRecord/);
  assert.match(mockService, /getFinalCancellationEvent/);
  assert.match(mockService, /verifyBookingMobile/);
  assert.match(mockService, /recordRemoteSurrender/);
  assert.match(mockService, /createRefundInstruction/);
  assert.match(mockService, /PRS:\$\{record\.pnr\}:\$\{record\.journeyDate\}:\$\{event\.id\}/);
  assert.match(mockService, /remote_surrender_recorded/);
  assert.match(mockService, /refund_instructed/);
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
  assert.doesNotMatch(route, /mobile:\s*\{/i);
});

test("keeps the completed citizen journey consistent with refund status", async () => {
  const [journey, status, claims] = await Promise.all([
    readFile(new URL("../app/ticket-wapas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/status/status-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sample-claims.ts", import.meta.url), "utf8"),
  ]);

  assert.match(journey, /writeSampleClaim\(processingClaim\)/);
  assert.match(journey, /status: "paid"/);
  assert.match(status, /readSampleClaims\(\)/);
  assert.match(status, /claimRecords\.map/);
  assert.match(claims, /ticket-wapas\.sample-claims\.v1/);
  assert.match(claims, /filter\(isSampleClaim\)/);
});

test("remote surrender is deterministic, persistent and safe to retry", async () => {
  const originalWindow = globalThis.window;
  globalThis.window = memoryWindow();
  try {
    const service = await mockRefundService();
    const record = service.getPrsTicketRecord("2468135790", "12424", "2026-08-24");
    assert.ok(record);
    assert.equal(record.passengerCount, 1);
    assert.equal(record.linkedMobileMasked, "+91 •••••• 2714");
    assert.equal(record.originalPayment.kind, "cash");

    const cancellation = service.getFinalCancellationEvent(record);
    assert.equal(cancellation.status, "final_cancelled");
    assert.equal(service.verifyBookingMobile(record, "000000").reason, "incorrect_code");
    assert.equal(service.verifyBookingMobile(record, "271406").ok, true);

    const first = service.recordRemoteSurrender({ record, cancellationEvent: cancellation, otpVerified: true, possessionConfirmed: true, consentGiven: true });
    const duplicate = service.recordRemoteSurrender({ record, cancellationEvent: cancellation, otpVerified: true, possessionConfirmed: true, consentGiven: true });
    assert.equal(first.reused, false);
    assert.equal(duplicate.reused, true);
    assert.equal(duplicate.receipt.reference, first.receipt.reference);

    const destination = { kind: "upi", maskedLabel: "UPI · asha.rail@okaxis", beneficiaryName: "Asha P.", nameMatched: true };
    const instructed = service.createRefundInstruction(first.receipt, destination);
    const retriedInstruction = service.createRefundInstruction(first.receipt, destination);
    assert.equal(instructed.receipt.status, "refund_instructed");
    assert.equal(retriedInstruction.reused, true);
    const paid = service.markRefundPaid(instructed.receipt);
    assert.equal(service.getExistingRemoteSurrender(record, cancellation).status, "paid");
    assert.equal(paid.paymentReference, "4268•••914");

    const noMobile = service.getPrsTicketRecord("7351902468", "12958", "2026-08-24");
    assert.equal(service.verifyBookingMobile(noMobile, "271406").reason, "no_booking_mobile");
    const multiPassenger = service.getPrsTicketRecord("6193048275", "12310", "2026-08-24");
    assert.equal(multiPassenger.passengerCount, 2);
    const posPaid = service.getPrsTicketRecord("9911223344", "12002", "2026-08-24");
    assert.equal(posPaid.originalPayment.kind, "pos");
    const restored = service.getPrsTicketRecord("8844001122", "12230", "2026-08-24");
    assert.equal(service.getFinalCancellationEvent(restored).status, "restored");
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
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
