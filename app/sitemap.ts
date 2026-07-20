import type { MetadataRoute } from "next";
import { posts } from "@/lib/posts";
import { siteOrigin } from "@/lib/absolute-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const staticRoutes = ["", "/about", "/blog", "/contact"];
  const languages = ["en", "ur"] as const;

  return [
    ...languages.flatMap((locale) =>
      staticRoutes.map((route) => ({
        url: `${base}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "/blog" ? ("weekly" as const) : ("monthly" as const),
        priority: route === "" ? 1 : 0.8,
      })),
    ),
    ...languages.flatMap((locale) =>
      posts.map((post) => ({
        url: `${base}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ),
  ];
}
