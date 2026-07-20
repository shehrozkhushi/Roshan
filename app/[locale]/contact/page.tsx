import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { ArrowUpRightIcon, AsteriskIcon } from "@/components/icons";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ur" ? "رابطہ کریں" : "Contact us",
    description:
      locale === "ur"
        ? "اپنے اگلے ڈیجیٹل پروجیکٹ کے بارے میں روشن اسٹوڈیو سے بات کریں۔"
        : "Tell Roshan Studio about your next digital product, website, or idea.",
    alternates: {
      languages: { en: "/en/contact", ur: "/ur/contact" },
    },
  };
}

export default async function ContactPage({
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
      <section className="page-hero contact-hero">
        <div className="shell">
          <div className="page-hero-index">03</div>
          <div className="page-hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              {copy.contact.eyebrow}
            </p>
            <h1>{copy.contact.title}</h1>
            <p>{copy.contact.intro}</p>
          </div>
        </div>
      </section>

      <section className="contact-content">
        <div className="shell contact-grid">
          <aside className="contact-aside">
            <div className="contact-signal" aria-hidden="true">
              <span className="signal-orbit signal-orbit--one" />
              <span className="signal-orbit signal-orbit--two" />
              <span className="signal-core">
                <AsteriskIcon />
              </span>
            </div>

            <div className="contact-details">
              <div>
                <p>{copy.contact.directTitle}</p>
                <a href={`mailto:${copy.common.email}`} dir="ltr">
                  {copy.common.email}
                  <ArrowUpRightIcon />
                </a>
              </div>
              <div>
                <p>{copy.contact.locationLabel}</p>
                <span>{copy.contact.location}</span>
              </div>
              <div className="availability">
                <i />
                <span>{copy.contact.availability}</span>
              </div>
            </div>
          </aside>

          <ContactForm locale={locale} copy={copy.contact} />
        </div>
      </section>
    </>
  );
}
