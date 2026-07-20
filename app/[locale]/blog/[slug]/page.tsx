import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ArrowUpRightIcon, AsteriskIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { getLocalizedPosts, getPost, posts } from "@/lib/posts";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const post = getPost(slug);
  if (!post || !isLocale(localeParam)) return {};

  return {
    title: post.title[localeParam],
    description: post.excerpt[localeParam],
    alternates: {
      languages: {
        en: `/en/blog/${slug}`,
        ur: `/ur/blog/${slug}`,
      },
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam;
  const post = getPost(slug);
  if (!post) notFound();

  const copy = getDictionary(locale);
  const date = new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${post.publishedAt}T00:00:00Z`));
  const related = getLocalizedPosts(locale).filter((item) => item.slug !== slug).slice(0, 2);

  return (
    <>
      <article>
        <header className={`article-hero article-hero--${post.accent}`}>
          <div className="shell article-hero-inner">
            <Link className="article-back" href={`/${locale}/blog`}>
              <ArrowIcon />
              {copy.common.backToBlog}
            </Link>
            <div className="article-meta">
              <span>{post.category[locale]}</span>
              <time dateTime={post.publishedAt}>{date}</time>
              <span>
                {post.readTime} {copy.common.minRead}
              </span>
            </div>
            <h1>{post.title[locale]}</h1>
            <p>{post.excerpt[locale]}</p>
            <div className="article-art" aria-hidden="true">
              <span className="article-disc" />
              <span className="article-stripe" />
              <span className="article-code">RS/{post.slug.slice(0, 3).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <div className="shell article-layout">
          <aside className="article-aside">
            <span>Roshan / 2026</span>
            <AsteriskIcon />
            <p>{copy.common.brand} {copy.common.brandSuffix}</p>
          </aside>
          <div className="article-body">
            {post.body[locale].map((paragraph, index) => (
              <p className={index === 0 ? "article-lead" : undefined} key={paragraph}>
                {paragraph}
              </p>
            ))}
            <blockquote>
              <AsteriskIcon />
              <p>{post.takeaway[locale]}</p>
            </blockquote>
          </div>
        </div>
      </article>

      <section className="section related-section">
        <div className="shell">
          <div className="section-heading section-heading--journal">
            <h2>{copy.blog.related}</h2>
            <Link className="text-link" href={`/${locale}/blog`}>
              {copy.blog.all}
              <ArrowUpRightIcon />
            </Link>
          </div>
          <div className="post-grid post-grid--preview">
            {related.map((item) => (
              <PostCard
                locale={locale}
                post={item}
                readLabel={copy.common.readMore}
                minuteLabel={copy.common.minRead}
                key={item.slug}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
