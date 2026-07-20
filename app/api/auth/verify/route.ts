import { MongoServerError, ObjectId } from "mongodb";
import { authJson, readAuthBody } from "@/lib/auth-request";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getPendingUsersCollection,
  getUsersCollection,
  isSameOrigin,
  MAX_VERIFICATION_ATTEMPTS,
  normalizeUserEmail,
  toSafeUser,
  verificationCodeMatches,
  type UserDocument,
} from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const verificationCodePattern = /^\d{6}$/;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return authJson({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }

  const rateLimit = checkRateLimit(request, "auth-verify", 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return authJson(
      { ok: false, code: "RATE_LIMITED" },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const parsed = await readAuthBody(request);
  if (!parsed.ok) return parsed.response;

  const allowedKeys = new Set(["email", "code", "locale", "website"]);
  if (Object.keys(parsed.value).some((key) => !allowedKeys.has(key))) {
    return authJson({ ok: false, code: "INVALID_REQUEST" }, 400);
  }

  const email = normalizeUserEmail(
    typeof parsed.value.email === "string" ? parsed.value.email : "",
  );
  const code = typeof parsed.value.code === "string" ? parsed.value.code : "";
  const locale = parsed.value.locale;
  const website =
    typeof parsed.value.website === "string" ? parsed.value.website.trim() : "";

  if (
    website ||
    (locale !== undefined && locale !== "en" && locale !== "ur")
  ) {
    return authJson({ ok: false, code: "INVALID_REQUEST" }, 400);
  }

  if (
    email.length > 254 ||
    !emailPattern.test(email) ||
    !verificationCodePattern.test(code)
  ) {
    return authJson({ ok: false, code: "INVALID_CODE" }, 422);
  }

  try {
    const [users, pendingUsers] = await Promise.all([
      getUsersCollection(),
      getPendingUsersCollection(),
    ]);
    const now = new Date();

    // Claim one of the five attempts atomically so concurrent requests cannot
    // bypass the per-code attempt limit.
    const pending = await pendingUsers.findOneAndUpdate(
      {
        email,
        expiresAt: { $gt: now },
        verificationAttempts: { $lt: MAX_VERIFICATION_ATTEMPTS },
      },
      {
        $inc: { verificationAttempts: 1 },
        $set: { updatedAt: now },
      },
      { returnDocument: "before" },
    );

    if (!pending) {
      const unavailablePending = await pendingUsers.findOne(
        { email },
        { projection: { _id: 1, expiresAt: 1 } },
      );

      if (unavailablePending && unavailablePending.expiresAt <= now) {
        await pendingUsers.deleteOne({ _id: unavailablePending._id });
        return authJson({ ok: false, code: "CODE_EXPIRED" }, 410);
      }

      return authJson({ ok: false, code: "INVALID_CODE" }, 422);
    }

    if (!verificationCodeMatches(email, code, pending.verificationCodeHash)) {
      return authJson({ ok: false, code: "INVALID_CODE" }, 422);
    }

    const user: UserDocument = {
      _id: new ObjectId(),
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await users.insertOne(user);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        await pendingUsers.deleteOne({ _id: pending._id });
        return authJson({ ok: false, code: "EMAIL_EXISTS" }, 409);
      }

      throw error;
    }

    try {
      await pendingUsers.deleteOne({ _id: pending._id });
    } catch (error) {
      // The account was created successfully; the TTL index will clean up a
      // pending document if this best-effort deletion temporarily fails.
      console.error(
        "Unable to remove verified pending signup:",
        error instanceof Error ? error.message : "unknown authentication error",
      );
    }

    return authJson({ ok: true, user: toSafeUser(user) }, 201);
  } catch (error) {
    console.error(
      "Email verification failed:",
      error instanceof Error ? error.message : "unknown authentication error",
    );
    return authJson({ ok: false, code: "AUTH_UNAVAILABLE" }, 503);
  }
}
