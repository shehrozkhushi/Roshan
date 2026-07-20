import { hash as hashPassword } from "bcryptjs";
import { MongoServerError, ObjectId } from "mongodb";
import { authJson, readAuthBody } from "@/lib/auth-request";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateVerificationCode,
  getPendingUsersCollection,
  getUsersCollection,
  hashVerificationCode,
  isSameOrigin,
  normalizeUserEmail,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_RESEND_COOLDOWN_MS,
  type PendingUserDocument,
} from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cooldownResponse(codeSentAt: Date, now: Date) {
  const elapsed = now.getTime() - codeSentAt.getTime();
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((VERIFICATION_RESEND_COOLDOWN_MS - elapsed) / 1000),
  );

  return authJson(
    { ok: false, code: "VERIFICATION_COOLDOWN" },
    429,
    { "Retry-After": String(retryAfterSeconds) },
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return authJson({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }

  const rateLimit = checkRateLimit(request, "auth-signup", 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return authJson(
      { ok: false, code: "RATE_LIMITED" },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const parsed = await readAuthBody(request);
  if (!parsed.ok) return parsed.response;

  const allowedKeys = new Set(["name", "email", "password", "website", "locale"]);
  if (Object.keys(parsed.value).some((key) => !allowedKeys.has(key))) {
    return authJson({ ok: false, code: "INVALID_REQUEST" }, 400);
  }

  const name = typeof parsed.value.name === "string" ? parsed.value.name.trim() : "";
  const email = normalizeUserEmail(
    typeof parsed.value.email === "string" ? parsed.value.email : "",
  );
  const password =
    typeof parsed.value.password === "string" ? parsed.value.password : "";
  const website =
    typeof parsed.value.website === "string" ? parsed.value.website.trim() : "";
  const localeValue = parsed.value.locale;
  const locale = localeValue === "ur" ? "ur" : "en";

  if (website) {
    return authJson({ ok: false, code: "INVALID_REQUEST" }, 400);
  }

  const fields: Record<string, string> = {};
  if (name.length < 2 || name.length > 60) fields.name = "INVALID_NAME";
  if (email.length > 254 || !emailPattern.test(email)) fields.email = "INVALID_EMAIL";
  if (
    localeValue !== undefined &&
    localeValue !== "en" &&
    localeValue !== "ur"
  ) {
    fields.locale = "INVALID_LOCALE";
  }
  if (
    password.length < 8 ||
    password.length > 72 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    fields.password = "INVALID_PASSWORD";
  }

  if (Object.keys(fields).length > 0) {
    return authJson({ ok: false, code: "VALIDATION_ERROR", fields }, 422);
  }

  try {
    const [users, pendingUsers] = await Promise.all([
      getUsersCollection(),
      getPendingUsersCollection(),
    ]);
    const now = new Date();
    const existingUser = await users.findOne(
      { email },
      { projection: { _id: 1 } },
    );

    if (existingUser) {
      return authJson({ ok: false, code: "EMAIL_EXISTS" }, 409);
    }

    const currentPending = await pendingUsers.findOne({ email });
    if (
      currentPending &&
      currentPending.expiresAt > now &&
      now.getTime() - currentPending.codeSentAt.getTime() <
        VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      return cooldownResponse(currentPending.codeSentAt, now);
    }

    const code = generateVerificationCode();
    const verificationCodeHash = hashVerificationCode(email, code);
    const passwordHash = await hashPassword(password, 12);
    const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MS);
    const pendingId = currentPending?._id ?? new ObjectId();
    const nextPending: PendingUserDocument = {
      _id: pendingId,
      name,
      email,
      passwordHash,
      verificationCodeHash,
      verificationAttempts: 0,
      locale,
      createdAt: currentPending?.createdAt ?? now,
      updatedAt: now,
      codeSentAt: now,
      expiresAt,
    };

    if (currentPending) {
      const update = await pendingUsers.replaceOne(
        {
          _id: currentPending._id,
          codeSentAt: currentPending.codeSentAt,
        },
        nextPending,
      );

      if (update.matchedCount !== 1) {
        const latestPending = await pendingUsers.findOne({ email });
        return latestPending
          ? cooldownResponse(latestPending.codeSentAt, new Date())
          : authJson({ ok: false, code: "AUTH_UNAVAILABLE" }, 503);
      }
    } else {
      try {
        await pendingUsers.insertOne(nextPending);
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          const latestPending = await pendingUsers.findOne({ email });
          return latestPending
            ? cooldownResponse(latestPending.codeSentAt, new Date())
            : authJson({ ok: false, code: "AUTH_UNAVAILABLE" }, 503);
        }

        throw error;
      }
    }

    try {
      await sendVerificationEmail({ to: email, name, code, locale });
    } catch {
      try {
        if (currentPending) {
          await pendingUsers.replaceOne(
            { _id: pendingId, verificationCodeHash },
            currentPending,
          );
        } else {
          await pendingUsers.deleteOne({ _id: pendingId, verificationCodeHash });
        }
      } catch (rollbackError) {
        console.error(
          "Unable to roll back pending signup:",
          rollbackError instanceof Error
            ? rollbackError.message
            : "unknown authentication error",
        );
      }

      console.error("Unable to deliver signup verification email.");
      return authJson(
        { ok: false, code: "VERIFICATION_SEND_FAILED" },
        503,
      );
    }

    return authJson(
      {
        ok: true,
        email,
        expiresInSeconds: VERIFICATION_CODE_TTL_MS / 1000,
        resendAfterSeconds: VERIFICATION_RESEND_COOLDOWN_MS / 1000,
      },
      202,
    );
  } catch (error) {
    console.error(
      "Signup failed:",
      error instanceof Error ? error.message : "unknown authentication error",
    );
    return authJson({ ok: false, code: "AUTH_UNAVAILABLE" }, 503);
  }
}
