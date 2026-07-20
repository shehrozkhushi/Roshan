import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRightIcon, AsteriskIcon } from "@/components/icons";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ur" ? "ہمارے بارے میں" : "About us",
    description:
      locale === "ur"
        ? "روشن اسٹوڈیو کی کہانی، اصول اور کام کرنے کا طریقہ۔"
        : "Meet Roshan Studio: a close-knit team combining strategy, design, and engineering.",
    alternates: {
      languages: { en: "/en/about", ur: "/ur/about" },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam;
  const copy = getDictionary(locale);

  return (
    <>
      <section className="page-hero about-hero">
        <div className="shell">
          <div className="page-hero-index">01</div>
          <div className="page-hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              {copy.about.eyebrow}
            </p>
            <h1>{copy.about.title}</h1>
            <p>{copy.about.intro}</p>
          </div>
        </div>
      </section>

      <section className="manifesto-section">
        <div className="shell manifesto-inner">
          <AsteriskIcon />
          <blockquote>{copy.about.manifesto}</blockquote>
        </div>
      </section>

      <section className="section story-section">
        <div className="shell story-grid">
          <div className="story-art" aria-hidden="true">
            <span className="story-sun" />
            <span className="story-arch" />
            <span className="story-line story-line--one" />
            <span className="story-line story-line--two" />
            <small>31.5204° N<br />74.3587° E</small>
          </div>
          <div className="story-copy">
            <p className="eyebrow">{copy.about.storyEyebrow}</p>
            <h2>{copy.about.storyTitle}</h2>
            <p>{copy.about.storyTextA}</p>
            <p>{copy.about.storyTextB}</p>
          </div>
        </div>
      </section>

      <section className="section values-section">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow">{copy.about.valuesEyebrow}</p>
            <h2>{copy.about.valuesTitle}</h2>
          </div>
          <div className="values-grid">
            {copy.about.values.map((value) => (
              <article className="value-card" key={value.number}>
                <span>{value.number}</span>
                <AsteriskIcon />
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="shell stats-grid">
          {copy.about.stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="closing-cta closing-cta--about">
        <div className="shell closing-cta-inner">
          <AsteriskIcon className="closing-star" />
          <div>
            <h2>{copy.about.closeTitle}</h2>
          </div>
          <Link className="button button--light" href={`/${locale}/contact`}>
            <span>{copy.about.closeCta}</span>
            <ArrowUpRightIcon />
          </Link>
        </div>
      </section>
    </>
  );
}
