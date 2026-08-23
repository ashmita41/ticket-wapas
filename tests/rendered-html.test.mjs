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

test("server-renders the Ticket Wapas prototype", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, context);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Ticket Wapas/);
  assert.match(html, /The train was cancelled/);
  assert.match(html, /Start with a sample ticket/);
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
  assert.doesNotMatch(client, /OPENAI_API_KEY|Bearer sk-/);
  assert.match(client, /Duplicate safely blocked/i);
  assert.match(client, /AI only reads the ticket/i);
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
