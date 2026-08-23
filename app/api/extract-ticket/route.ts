const MAX_FILE_BYTES = 5 * 1024 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

type RateEntry = { count: number; resetAt: number };
const requests = new Map<string, RateEntry>();

const ticketSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "pnr",
    "trainNumber",
    "trainName",
    "date",
    "origin",
    "destination",
    "passengers",
    "fare",
    "mobile",
    "confidence",
  ],
  properties: {
    pnr: { type: ["string", "null"] },
    trainNumber: { type: ["string", "null"] },
    trainName: { type: ["string", "null"] },
    date: { type: ["string", "null"], description: "Journey date as printed, in a readable format." },
    origin: { type: ["string", "null"] },
    destination: { type: ["string", "null"] },
    passengers: { type: ["integer", "null"] },
    fare: { type: ["number", "null"], description: "Total fare in Indian rupees, without a currency symbol." },
    mobile: { type: ["string", "null"], description: "Masked booking mobile only if visibly printed." },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: ["pnr", "trainNumber", "date", "origin", "destination", "fare"],
      properties: {
        pnr: { type: "string", enum: ["extracted", "unclear", "missing"] },
        trainNumber: { type: "string", enum: ["extracted", "unclear", "missing"] },
        date: { type: "string", enum: ["extracted", "unclear", "missing"] },
        origin: { type: "string", enum: ["extracted", "unclear", "missing"] },
        destination: { type: "string", enum: ["extracted", "unclear", "missing"] },
        fare: { type: "string", enum: ["extracted", "unclear", "missing"] },
      },
    },
  },
} as const;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getClientId(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function isRateLimited(clientId: string) {
  const now = Date.now();
  const existing = requests.get(clientId);
  if (!existing || now >= existing.resetAt) {
    requests.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > MAX_REQUESTS_PER_WINDOW;
}

function readOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (isRateLimited(getClientId(request))) {
    return json({ code: "RATE_LIMITED", message: "Too many ticket reads. Please try again shortly." }, 429);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ code: "AI_UNAVAILABLE", message: "Ticket reader is not configured. Continue with manual entry." }, 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ code: "INVALID_FORM", message: "Expected a multipart ticket upload." }, 400);
  }

  const upload = form.get("ticket");
  if (!(upload instanceof File)) {
    return json({ code: "MISSING_FILE", message: "Choose a ticket image first." }, 400);
  }
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(upload.type)) {
    return json({ code: "UNSUPPORTED_FILE", message: "Use a JPG, PNG or WEBP image." }, 415);
  }
  if (upload.size === 0 || upload.size > MAX_FILE_BYTES) {
    return json({ code: "INVALID_SIZE", message: "Ticket images must be between 1 byte and 5 MB." }, 413);
  }

  const bytes = new Uint8Array(await upload.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  const dataUrl = `data:${upload.type};base64,${btoa(binary)}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TICKET_MODEL || "gpt-4.1-mini",
      store: false,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Read this Indian railway PRS counter ticket. Extract only facts visibly printed on the ticket. Never infer a missing value. Mark every key field as extracted, unclear, or missing. Do not determine cancellation status, refund eligibility, identity, or refund amount.",
            },
            { type: "input_image", image_url: dataUrl, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "counter_ticket_fields",
          strict: true,
          schema: ticketSchema,
        },
      },
      max_output_tokens: 900,
    }),
  });

  if (!response.ok) {
    const upstream = (await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string; type?: string } }
      | null;
    console.error("[ticket-reader] OpenAI request rejected", {
      status: response.status,
      code: upstream?.error?.code ?? "unknown",
      type: upstream?.error?.type ?? "unknown",
      message: upstream?.error?.message ?? "No upstream message",
    });
    return json({ code: "UPSTREAM_ERROR", message: "The AI reader is temporarily unavailable. Continue with manual entry." }, 502);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const outputText = readOutputText(payload);
  if (!outputText) {
    return json({ code: "EMPTY_RESULT", message: "No ticket fields were returned. Continue with manual entry." }, 502);
  }

  try {
    const parsed = JSON.parse(outputText);
    return json({ ticket: parsed, source: "openai-structured-extraction", stored: false });
  } catch {
    return json({ code: "INVALID_RESULT", message: "Ticket fields could not be validated. Continue with manual entry." }, 502);
  }
}
