import { createHash } from "node:crypto";

type Bucket = {
  attempts: number[];
};

const buckets = new Map<string, Bucket>();

function requestFingerprint(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "local";

  return createHash("sha256")
    .update(`${scope}:${address}`)
    .digest("hex")
    .slice(0, 32);
}

export function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const key = requestFingerprint(request, scope);
  const active = (buckets.get(key)?.attempts ?? []).filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (active.length >= limit) {
    const oldest = active[0] ?? now;
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  buckets.set(key, { attempts: [...active, now] });

  if (buckets.size > 5_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.attempts.every((timestamp) => now - timestamp >= windowMs)) {
        buckets.delete(bucketKey);
      }
    }
  }

  return { allowed: true as const, retryAfterSeconds: 0 };
}
