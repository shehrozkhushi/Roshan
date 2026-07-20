import { NextResponse } from "next/server";
import { getLocalizedPosts } from "@/lib/posts";
import { isLocale, type Locale } from "@/lib/i18n";

export function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLocale = url.searchParams.get("lang") ?? "en";
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : "en";
  const category = url.searchParams.get("category")?.trim().toLocaleLowerCase();

  const allPosts = getLocalizedPosts(locale);
  const filteredPosts = category
    ? allPosts.filter((post) => post.category.toLocaleLowerCase() === category)
    : allPosts;

  return NextResponse.json(
    {
      ok: true,
      data: filteredPosts,
      meta: { locale, total: filteredPosts.length },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
