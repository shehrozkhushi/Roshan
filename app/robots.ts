import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/absolute-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/contact"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
