"use client";

import { useMemo, useState } from "react";
import { PostCard } from "@/components/post-card";
import type { Locale } from "@/lib/i18n";

type FilterPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: number;
  accent: "blue" | "lime" | "coral";
};

export function BlogFilter({
  locale,
  posts,
  allLabel,
  emptyLabel,
  readLabel,
  minuteLabel,
}: {
  locale: Locale;
  posts: FilterPost[];
  allLabel: string;
  emptyLabel: string;
  readLabel: string;
  minuteLabel: string;
}) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(
    () => Array.from(new Set(posts.map((post) => post.category))),
    [posts],
  );
  const visible = category === "all" ? posts : posts.filter((post) => post.category === category);

  return (
    <>
      <div className="filter-row" aria-label="Filter articles">
        <button
          type="button"
          className={category === "all" ? "is-active" : ""}
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          {allLabel}
        </button>
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={category === item ? "is-active" : ""}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="post-grid">
          {visible.map((post) => (
            <PostCard
              locale={locale}
              post={post}
              readLabel={readLabel}
              minuteLabel={minuteLabel}
              key={post.slug}
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">{emptyLabel}</p>
      )}
    </>
  );
}
