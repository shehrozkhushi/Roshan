import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { ObjectId, type Collection } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-roshan_session" : "roshan_session";
const SESSION_LENGTH_MS = 7 * 24 * 60 * 60 * 1000;
export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;

export type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type SessionDocument = {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
};

export type PendingUserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  verificationCodeHash: string;
  verificationAttempts: number;
  locale: "en" | "ur";
  createdAt: Date;
  updatedAt: Date;
  codeSentAt: Date;
  expiresAt: Date;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

let indexesPromise: Promise<void> | undefined;

async function collections() {
  const database = await getDatabase();
  return {
    users: database.collection<UserDocument>("users"),
    sessions: database.collection<SessionDocument>("sessions"),
    pendingUsers: database.collection<PendingUserDocument>("pending_users"),
  };
}

export async function ensureAuthIndexes() {
  indexesPromise ??= (async () => {
    const { users, sessions, pendingUsers } = await collections();
    await Promise.all([
      users.createIndex({ email: 1 }, { unique: true, name: "unique_user_email" }),
      sessions.createIndex(
        { tokenHash: 1 },
        { unique: true, name: "unique_session_token" },
      ),
      sessions.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "expire_user_sessions" },
      ),
      sessions.createIndex({ userId: 1 }, { name: "sessions_by_user" }),
      pendingUsers.createIndex(
        { email: 1 },
        { unique: true, name: "unique_pending_user_email" },
      ),
      pendingUsers.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: "expire_pending_users" },
      ),
    ]);
  })();

  try {
    await indexesPromise;
  } catch (error) {
    indexesPromise = undefined;
    throw error;
  }
}

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  await ensureAuthIndexes();
  const { users } = await collections();
  return users;
}

export async function getPendingUsersCollection(): Promise<
  Collection<PendingUserDocument>
> {
  await ensureAuthIndexes();
  const { pendingUsers } = await collections();
  return pendingUsers;
}

export function normalizeUserEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateVerificationCode() {
  return randomInt(0, 10 ** VERIFICATION_CODE_LENGTH)
    .toString()
    .padStart(VERIFICATION_CODE_LENGTH, "0");
}

function verificationSecret() {
  const secret = process.env.AUTH_VERIFICATION_SECRET;
  if (!secret?.trim()) {
    throw new Error("AUTH_VERIFICATION_SECRET is not configured.");
  }

  return secret;
}

export function hashVerificationCode(email: string, code: string) {
  return createHmac("sha256", verificationSecret())
    .update(normalizeUserEmail(email))
    .update("\0")
    .update(code)
    .digest("hex");
}

export function verificationCodeMatches(
  email: string,
  code: string,
  expectedHash: string,
) {
  const actual = Buffer.from(hashVerificationCode(email, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return (
    actual.length === 32 &&
    expected.length === actual.length &&
    timingSafeEqual(actual, expected)
  );
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function toSafeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function startUserSession(userId: ObjectId) {
  await ensureAuthIndexes();
  const { sessions } = await collections();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_LENGTH_MS);

  await sessions.insertOne({
    _id: new ObjectId(),
    userId,
    tokenHash: tokenHash(token),
    createdAt: now,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}

export async function endUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const { sessions } = await collections();
      await sessions.deleteOne({ tokenHash: tokenHash(token) });
    } catch {
      // Cookie deletion is still completed when the database is temporarily unavailable.
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;

  try {
    const { users, sessions } = await collections();
    const session = await sessions.findOne({
      tokenHash: tokenHash(token),
      expiresAt: { $gt: new Date() },
    });

    if (!session) return null;

    const user = await users.findOne({ _id: session.userId });
    return user ? toSafeUser(user) : null;
  } catch {
    return null;
  }
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  if (!origin) return process.env.NODE_ENV !== "production";
  if (origin === "null") return false;

  try {
    const requestOrigin = new URL(origin).origin;
    const configuredOrigin = process.env.APP_ORIGIN?.trim();

    if (configuredOrigin) {
      return requestOrigin === new URL(configuredOrigin).origin;
    }

    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}
