"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Dictionary, Locale } from "@/lib/i18n";

type HeaderProps = {
  locale: Locale;
  copy: Pick<Dictionary, "common" | "nav" | "auth">;
};

export function SiteHeader({ locale, copy }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousOpen = useRef(false);

  const links = [
    { href: `/${locale}`, label: copy.nav.home },
    { href: `/${locale}/about`, label: copy.nav.about },
    { href: `/${locale}/blog`, label: copy.nav.blog },
    { href: `/${locale}/contact`, label: copy.nav.contact },
  ];
  const accountLink = user
    ? { href: `/${locale}/account`, label: copy.auth.nav.account }
    : { href: `/${locale}/login`, label: copy.auth.nav.login };
  const mobileLinks = [...links, accountLink];

  const alternateLocale = locale === "en" ? "ur" : "en";
  const alternatePath = pathname.replace(/^\/(en|ur)(?=\/|$)/, `/${alternateLocale}`);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.toggle("menu-is-open", open);

    if (previousOpen.current && !open) {
      triggerRef.current?.focus();
    }
    previousOpen.current = open;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("menu-is-open");
    };
  }, [open]);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result = (await response.json()) as {
          ok?: boolean;
          user?: { name: string };
        };
        if (active) setUser(response.ok && result.ok && result.user ? result.user : null);
      } catch {
        if (active) setUser(null);
      }
    }

    void loadUser();
    window.addEventListener("roshan-auth-changed", loadUser);

    return () => {
      active = false;
      window.removeEventListener("roshan-auth-changed", loadUser);
    };
  }, []);

  function isCurrent(href: string) {
    if (href === `/${locale}`) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href={`/${locale}`} aria-label={`${copy.common.brand} ${copy.common.brandSuffix}`}>
          <span className="wordmark-mark" aria-hidden="true">
            <span />
          </span>
          <span className="wordmark-type">
            {copy.common.brand}
            <small>{copy.common.brandSuffix}</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            className="language-switch"
            href={alternatePath || `/${alternateLocale}`}
            hrefLang={alternateLocale}
            aria-label={copy.common.language}
          >
            {copy.common.localeName}
          </Link>
          <ThemeToggle label={copy.common.theme} />
          <Link
            className="header-auth-link"
            href={accountLink.href}
            aria-current={isCurrent(accountLink.href) ? "page" : undefined}
          >
            <span className="header-auth-avatar" aria-hidden="true">
              {user ? user.name.slice(0, 1).toUpperCase() : "U"}
            </span>
            <span>{user ? user.name.split(/\s+/)[0] : accountLink.label}</span>
          </Link>
          <Link className="button button--small header-cta" href={`/${locale}/contact`}>
            <span>{copy.nav.cta}</span>
            <ArrowUpRightIcon />
          </Link>
          <button
            ref={triggerRef}
            className="icon-button menu-trigger"
            type="button"
            aria-label={open ? copy.common.menuClose : copy.common.menuOpen}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div className="mobile-menu" id="mobile-menu" data-open={open}>
        <nav className="shell mobile-menu-inner" aria-label="Mobile navigation">
          <div className="mobile-nav-links">
            {mobileLinks.map((link, index) => (
              <Link
                href={link.href}
                key={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {link.label}
                <ArrowUpRightIcon />
              </Link>
            ))}
          </div>
          <div className="mobile-menu-foot">
            <a href={`mailto:${copy.common.email}`} dir="ltr">
              {copy.common.email}
            </a>
            <span>Lahore · PK</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
