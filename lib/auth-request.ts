import { NextResponse } from "next/server";

export const AUTH_BODY_LIMIT = 8_192;

export function authJson(
  body: unknown,
  status = 200,
  extraHeaders?: HeadersInit,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function readAuthBody(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return { ok: false as const, response: authJson({ ok: false, code: "JSON_REQUIRED" }, 415) };
  }

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > AUTH_BODY_LIMIT) {
    return {
      ok: false as const,
      response: authJson({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413),
    };
  }

  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > AUTH_BODY_LIMIT) {
      return {
        ok: false as const,
        response: authJson({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413),
      };
    }

    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Invalid JSON object");
    }

    return { ok: true as const, value: value as Record<string, unknown> };
  } catch {
    return {
      ok: false as const,
      response: authJson({ ok: false, code: "INVALID_JSON" }, 400),
    };
  }
}
