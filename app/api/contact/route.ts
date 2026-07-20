import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getContactPersistenceMode,
  saveContactSubmission,
  type ContactSubmission,
} from "@/lib/contact-store";
import { sendContactNotification } from "@/lib/email";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const attempts = new Map<string, number[]>();

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  service?: unknown;
  budget?: unknown;
  message?: unknown;
  locale?: unknown;
  website?: unknown;
};

function json(data: unknown, status: number, extraHeaders?: HeadersInit) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function rateLimitKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(candidate).digest("hex").slice(0, 20);
}

function isRateLimited(key: string) {
  const now = Date.now();
  const active = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (active.length >= MAX_REQUESTS) {
    attempts.set(key, active);
    return true;
  }

  attempts.set(key, [...active, now]);
  return false;
}

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  return json(
    {
      ok: true,
      service: "contact",
      accepts: "POST",
      persistence: getContactPersistenceMode(),
    },
    200,
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, error: { code: "INVALID_ORIGIN" } }, 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ ok: false, error: { code: "JSON_REQUIRED" } }, 415);
  }

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_BODY_BYTES) {
    return json({ ok: false, error: { code: "PAYLOAD_TOO_LARGE" } }, 413);
  }

  let raw = "";
  let payload: ContactPayload;

  try {
    raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: { code: "PAYLOAD_TOO_LARGE" } }, 413);
    }
    payload = JSON.parse(raw) as ContactPayload;
  } catch {
    return json({ ok: false, error: { code: "INVALID_JSON" } }, 400);
  }

  // Quietly accept likely automated spam without storing it.
  if (cleanString(payload.website, 200)) {
    return json({ ok: true, id: randomUUID() }, 201);
  }

  if (isRateLimited(rateLimitKey(request))) {
    return json(
      { ok: false, error: { code: "RATE_LIMITED" } },
      429,
      { "Retry-After": String(WINDOW_MS / 1000) },
    );
  }

  const name = cleanString(payload.name, 80);
  const email = cleanString(payload.email, 254).toLowerCase();
  const company = cleanString(payload.company, 120);
  const service = cleanString(payload.service, 120);
  const budget = cleanString(payload.budget, 80);
  const message = cleanString(payload.message, 2000);
  const locale = typeof payload.locale === "string" ? payload.locale : "";

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "INVALID_NAME";
  if (!emailPattern.test(email)) fields.email = "INVALID_EMAIL";
  if (service.length < 2) fields.service = "INVALID_SERVICE";
  if (message.length < 20) fields.message = "MESSAGE_TOO_SHORT";
  if (!isLocale(locale)) fields.locale = "INVALID_LOCALE";

  if (Object.keys(fields).length > 0) {
    return json(
      { ok: false, error: { code: "VALIDATION_ERROR", fields } },
      422,
    );
  }

  const validatedLocale = isLocale(locale) ? locale : "en";
  const submission: ContactSubmission = {
    id: randomUUID(),
    name,
    email,
    company,
    service,
    budget,
    message,
    locale: validatedLocale,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveContactSubmission(submission);
  } catch {
    console.error("Unable to persist contact submission.");
    return json({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } }, 503);
  }

  try {
    await sendContactNotification(submission);
  } catch {
    console.error("Unable to deliver contact notification.");
    return json({ ok: false, error: { code: "NOTIFICATION_UNAVAILABLE" } }, 503);
  }

  return json(
    { ok: true, id: submission.id, createdAt: submission.createdAt },
    201,
  );
}
