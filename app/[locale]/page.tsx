import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ArrowUpRightIcon, AsteriskIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getLocalizedPosts } from "@/lib/posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const urdu = locale === "ur";
  return {
    title: urdu ? "روشن اسٹوڈیو — حکمتِ عملی، ڈیزائن اور انجینئرنگ" : "Strategy, design & engineering",
    description: urdu
      ? "لاہور کا دو لسانی ڈیجیٹل اسٹوڈیو جو حکمتِ عملی، ڈیزائن اور فل اسٹیک انجینئرنگ کو یکجا کرتا ہے۔"
      : "A Lahore digital studio making thoughtful products through strategy, design, and full-stack engineering.",
    alternates: {
      languages: { en: "/en", ur: "/ur" },
    },
  };
}

export default async function HomePage({
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
      <section className="home-hero">
        <div className="shell hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              {copy.home.eyebrow}
            </p>
            <h1>
              {copy.home.titleA}
              <span>{copy.home.titleAccent}</span>
            </h1>
            <p className="hero-intro">{copy.home.intro}</p>
            <div className="button-row">
              <Link className="button button--ink" href={`/${locale}/contact`}>
                <span>{copy.home.primary}</span>
                <ArrowUpRightIcon />
              </Link>
              <Link className="text-link hero-secondary" href={`/${locale}/about`}>
                {copy.home.secondary}
                <ArrowIcon />
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-frame">
              <Image
                src="/images/roshan-hero.png"
                alt=""
                width={1536}
                height={1024}
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
              />
              <div className="hero-stamp" aria-hidden="true">
                <span>RS</span>
                <small>©26</small>
              </div>
            </div>
            <span className="hero-caption">Strategy · Design · Code</span>
          </div>
        </div>
        <a className="scroll-cue" href="#capabilities">
          <span>{copy.home.scroll}</span>
          <i />
        </a>
      </section>

      <section className="section services-section" id="capabilities">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">{copy.home.servicesEyebrow}</p>
              <h2>{copy.home.servicesTitle}</h2>
            </div>
            <p>{copy.home.servicesIntro}</p>
          </div>

          <div className="services-list">
            {copy.home.services.map((service) => (
              <article className="service-row" key={service.number}>
                <span className="service-number">{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <span className="service-icon" aria-hidden="true">
                  <ArrowUpRightIcon />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section work-section">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow eyebrow--light">{copy.home.workEyebrow}</p>
            <h2>{copy.home.workTitle}</h2>
          </div>

          <div className="project-grid">
            {copy.home.projects.map((project, index) => (
              <article className={`project-card project-card--${index + 1}`} key={project.title}>
                <div className="project-visual" aria-hidden="true">
                  <span className="project-orbit" />
                  <span className="project-object">{index === 0 ? "S" : "P"}</span>
                  <span className="project-grid-lines" />
                </div>
                <div className="project-copy">
                  <p className="project-tag">{project.tag}</p>
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                  </div>
                  <div className="project-metric">
                    <strong>{project.metric}</strong>
                    <span>{project.metricLabel}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="shell process-grid">
          <div className="process-art" aria-hidden="true">
            <div className="process-disc">
              <AsteriskIcon />
            </div>
            <span className="process-ring process-ring--one" />
            <span className="process-ring process-ring--two" />
          </div>
          <div className="process-copy">
            <p className="eyebrow">{copy.home.processEyebrow}</p>
            <h2>{copy.home.processTitle}</h2>
            <p>{copy.home.processText}</p>
            <ol className="process-steps">
              {copy.home.processSteps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section journal-preview">
        <div className="shell">
          <div className="section-heading section-heading--journal">
            <div>
              <p className="eyebrow">{copy.home.journalEyebrow}</p>
              <h2>{copy.home.journalTitle}</h2>
            </div>
            <Link className="text-link" href={`/${locale}/blog`}>
              {copy.home.allPosts}
              <ArrowIcon />
            </Link>
          </div>
          <div className="post-grid post-grid--preview">
            {localizedPosts.slice(0, 2).map((post) => (
              <PostCard
                key={post.slug}
                locale={locale}
                post={post}
                readLabel={copy.common.readMore}
                minuteLabel={copy.common.minRead}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="shell closing-cta-inner">
          <AsteriskIcon className="closing-star" />
          <div>
            <h2>{copy.home.closeTitle}</h2>
            <p>{copy.home.closeText}</p>
          </div>
          <Link className="button button--light" href={`/${locale}/contact`}>
            <span>{copy.home.closeCta}</span>
            <ArrowUpRightIcon />
          </Link>
        </div>
      </section>
    </>
  );
}
