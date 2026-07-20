import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogFilter } from "@/components/blog-filter";
import { PostCard } from "@/components/post-card";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getLocalizedPosts } from "@/lib/posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ur" ? "جرنل" : "Journal",
    description:
      locale === "ur"
        ? "ڈیزائن، ٹیکنالوجی اور بہتر ڈیجیٹل پروڈکٹس پر روشن اسٹوڈیو کے مضامین۔"
        : "Practical notes on design, technology, and making better digital products.",
    alternates: {
      languages: { en: "/en/blog", ur: "/ur/blog" },
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam;
  const copy = getDictionary(locale);
  const localizedPosts = getLocalizedPosts(locale);

  return (
    <>
      <section className="page-hero blog-hero">
        <div className="shell">
          <div className="page-hero-index">02</div>
          <div className="page-hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              {copy.blog.eyebrow}
            </p>
            <h1>{copy.blog.title}</h1>
            <p>{copy.blog.intro}</p>
          </div>
        </div>
      </section>

      <section className="featured-post-section">
        <div className="shell">
          <p className="section-kicker">{copy.blog.featured}</p>
          <PostCard
            locale={locale}
            post={localizedPosts[0]}
            readLabel={copy.common.readMore}
            minuteLabel={copy.common.minRead}
            featured
          />
        </div>
      </section>

      <section className="section all-posts-section">
        <div className="shell">
          <BlogFilter
            locale={locale}
            posts={localizedPosts}
            allLabel={copy.blog.all}
            emptyLabel={copy.blog.empty}
            readLabel={copy.common.readMore}
            minuteLabel={copy.common.minRead}
          />
        </div>
      </section>
    </>
  );
}
