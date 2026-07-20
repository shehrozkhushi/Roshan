import type { Metadata } from "next";
import "@/app/globals.css";
import { absoluteUrl } from "@/lib/absolute-url";

export const metadata: Metadata = {
  metadataBase: absoluteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Roshan Studio — Strategy, design & engineering",
    template: "%s — Roshan Studio",
  },
  description:
    "A bilingual digital product studio combining strategy, interface design, and full-stack engineering.",
  applicationName: "Roshan Studio",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Roshan Studio",
    description:
      "Thoughtful digital products, designed and built in Lahore for teams everywhere.",
    type: "website",
    images: ["/images/roshan-hero.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

const preferenceScript = `
  (function () {
    try {
      var saved = localStorage.getItem("roshan-theme");
      var theme = saved === "dark" || saved === "light"
        ? saved
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      var locale = location.pathname.split("/")[1] === "ur" ? "ur" : "en";
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
    } catch (_) {}
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
      </head>
      <body id="top">{children}</body>
    </html>
  );
}
