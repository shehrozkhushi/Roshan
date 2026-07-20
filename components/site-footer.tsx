import Link from "next/link";
import { ArrowIcon, ArrowUpRightIcon, AsteriskIcon } from "@/components/icons";
import type { Dictionary, Locale } from "@/lib/i18n";

export function SiteFooter({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Pick<Dictionary, "common" | "nav" | "footer">;
}) {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-lead">
          <AsteriskIcon className="footer-asterisk" />
          <p>{copy.footer.prompt}</p>
          <Link className="circle-link" href={`/${locale}/contact`} aria-label={copy.nav.cta}>
            <ArrowUpRightIcon />
          </Link>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="wordmark wordmark--footer" href={`/${locale}`}>
              <span className="wordmark-mark" aria-hidden="true">
                <span />
              </span>
              <span className="wordmark-type">
                {copy.common.brand}
                <small>{copy.common.brandSuffix}</small>
              </span>
            </Link>
            <p>{copy.footer.note}</p>
          </div>

          <div className="footer-column">
            <p className="footer-label">{copy.footer.explore}</p>
            <Link href={`/${locale}`}>{copy.nav.home}</Link>
            <Link href={`/${locale}/about`}>{copy.nav.about}</Link>
            <Link href={`/${locale}/blog`}>{copy.nav.blog}</Link>
            <Link href={`/${locale}/contact`}>{copy.nav.contact}</Link>
          </div>

          <div className="footer-column">
            <p className="footer-label">{copy.footer.contact}</p>
            <a href={`mailto:${copy.common.email}`} dir="ltr">
              {copy.common.email}
            </a>
            <a href="tel:03094824499" dir="ltr">
              03094824499
            </a>
            <span>Lahore · PK</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {year} {copy.common.brand}. {copy.footer.rights}
          </p>
          <a href="#top" className="back-to-top">
            {copy.footer.top}
            <ArrowIcon className="arrow-up" />
          </a>
        </div>
      </div>
    </footer>
  );
}
