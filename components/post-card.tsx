import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";

type PostCardProps = {
  locale: Locale;
  post: {
    slug: string;
    category: string;
    title: string;
    excerpt: string;
    publishedAt: string;
    readTime: number;
    accent: "blue" | "lime" | "coral";
  };
  readLabel: string;
  minuteLabel: string;
  featured?: boolean;
};

export function PostCard({
  locale,
  post,
  readLabel,
  minuteLabel,
  featured = false,
}: PostCardProps) {
  const date = new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${post.publishedAt}T00:00:00Z`));

  return (
    <article
      className={`post-card post-card--${post.accent}${featured ? " post-card--featured" : ""}`}
    >
      <Link href={`/${locale}/blog/${post.slug}`} className="post-card-link">
        <div className="post-art" aria-hidden="true">
          <span className="post-art-shape post-art-shape--one" />
          <span className="post-art-shape post-art-shape--two" />
          <span className="post-art-index">R/{post.slug.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="post-card-body">
          <div className="post-meta">
            <span>{post.category}</span>
            <span>
              {post.readTime} {minuteLabel}
            </span>
          </div>
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
          <div className="post-card-foot">
            <time dateTime={post.publishedAt}>{date}</time>
            <span className="text-link">
              {readLabel}
              <ArrowUpRightIcon />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
