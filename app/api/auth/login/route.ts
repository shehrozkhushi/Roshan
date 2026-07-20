import { compare } from "bcryptjs";
import { authJson, readAuthBody } from "@/lib/auth-request";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getUsersCollection,
  isSameOrigin,
  startUserSession,
  toSafeUser,
} from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dummyHash = "$2b$12$C6UzMDM.H6dfI/f/IKxGhuYFi9p4BkBzcdZpOA7Yk2iVZQh7nLgq2";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return authJson({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }

  const rateLimit = checkRateLimit(request, "auth-login", 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return authJson(
      { ok: false, code: "RATE_LIMITED" },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const parsed = await readAuthBody(request);
  if (!parsed.ok) return parsed.response;

  const allowedKeys = new Set(["email", "password", "website"]);
  if (Object.keys(parsed.value).some((key) => !allowedKeys.has(key))) {
    return authJson({ ok: false, code: "INVALID_REQUEST" }, 400);
  }

  const website =
    typeof parsed.value.website === "string" ? parsed.value.website.trim() : "";
  if (website) {
    return authJson({ ok: false, code: "INVALID_REQUEST" }, 400);
  }

  const email =
    typeof parsed.value.email === "string"
      ? parsed.value.email.trim().toLowerCase()
      : "";
  const password =
    typeof parsed.value.password === "string" ? parsed.value.password : "";

  if (
    !email ||
    !password ||
    password.length > 72 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return authJson({ ok: false, code: "INVALID_CREDENTIALS" }, 401);
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    const passwordMatches = await compare(password, user?.passwordHash ?? dummyHash);

    if (!user || !passwordMatches) {
      return authJson({ ok: false, code: "INVALID_CREDENTIALS" }, 401);
    }

    await startUserSession(user._id);
    return authJson({ ok: true, user: toSafeUser(user) });
  } catch (error) {
    console.error(
      "Login failed:",
      error instanceof Error ? error.message : "unknown authentication error",
    );
    return authJson({ ok: false, code: "AUTH_UNAVAILABLE" }, 503);
  }
}
