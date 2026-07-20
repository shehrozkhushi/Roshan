import { authJson } from "@/lib/auth-request";
import { endUserSession, isSameOrigin } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return authJson({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }

  await endUserSession();
  return authJson({ ok: true });
}
