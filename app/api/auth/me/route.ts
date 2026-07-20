import { authJson } from "@/lib/auth-request";
import { getCurrentUser } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return authJson({ ok: false, code: "UNAUTHENTICATED" }, 401);
  }

  return authJson({ ok: true, user });
}
