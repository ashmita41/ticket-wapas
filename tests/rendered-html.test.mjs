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
  assert.match(html, /The train was cancelled/);
  assert.match(html, /Start with a sample ticket/);
  assert.match(html, /PUBLIC SERVICE PROTOTYPE/);
  assert.match(html, /Independent project — not a government website/);
  assert.match(html, /Cancelled PRS counter tickets/);
  assert.match(html, /synthetic data only/i);
  assert.match(html, /Not affiliated with or operated by Indian Railways or IRCTC/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
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
  assert.match(client, /Duplicate safely blocked/i);
  assert.match(client, /AI reads the ticket/i);
  assert.match(client, /type="date"/i);
  assert.match(client, /I checked the PNR, train number and journey date/i);
  assert.match(client, /Edit ticket details/i);
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
    trainNumber: null,
    trainName: null,
    date: null,
    origin: null,
    destination: null,
    passengers: null,
    fare: null,
    confidence: {
      pnr: "missing",
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
    message: "This image does not look like a PRS counter ticket. Upload a clear synthetic counter-ticket image or enter the details manually.",
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

test("abstains when a ticket classification has too little readable evidence", async () => {
  const app = await worker();
  const result = await withMockOpenAI(extractedTicket({
    pnr: null,
    trainNumber: null,
    origin: null,
    destination: null,
    fare: null,
    confidence: {
      pnr: "missing",
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
