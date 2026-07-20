import { notFound } from "next/navigation";
import { LocaleSync } from "@/components/locale-sync";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam;
  const dictionary = getDictionary(locale);

  return (
    <div
      className={`locale-root locale-root--${locale}`}
      lang={locale}
      dir={locale === "ur" ? "rtl" : "ltr"}
    >
      <LocaleSync locale={locale} />
      <a className="skip-link" href="#main-content">
        {dictionary.common.skip}
      </a>
      <SiteHeader locale={locale} copy={dictionary} />
      <main id="main-content">{children}</main>
      <SiteFooter locale={locale} copy={dictionary} />
    </div>
  );
}
