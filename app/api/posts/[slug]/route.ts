import { NextResponse } from "next/server";
import { getPost } from "@/lib/posts";
import { isLocale, type Locale } from "@/lib/i18n";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const post = getPost(slug);

  if (!post) {
    return NextResponse.json(
      { ok: false, error: { code: "POST_NOT_FOUND" } },
      { status: 404 },
    );
  }

  const requestedLocale = new URL(request.url).searchParams.get("lang") ?? "en";
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : "en";

  return NextResponse.json(
    {
      ok: true,
      data: {
        slug: post.slug,
        category: post.category[locale],
        title: post.title[locale],
        excerpt: post.excerpt[locale],
        body: post.body[locale],
        takeaway: post.takeaway[locale],
        publishedAt: post.publishedAt,
        readTime: post.readTime,
        accent: post.accent,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
