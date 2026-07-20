import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { AccountLogout } from "@/components/account-logout";
import { AsteriskIcon } from "@/components/icons";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  const copy = getDictionary(locale);
  const joined = new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(user.createdAt));

  return (
    <section className="account-page">
      <div className="shell">
        <header className="account-heading">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {copy.auth.account.eyebrow}
          </p>
          <h1>
            {copy.auth.account.title}, <span>{user.name}.</span>
          </h1>
          <p>{copy.auth.account.intro}</p>
        </header>

        <div className="account-grid">
          <div className="account-art" aria-hidden="true">
            <span>{user.name.slice(0, 1).toUpperCase()}</span>
            <AsteriskIcon />
            <small>Roshan Member</small>
          </div>
          <div className="profile-card">
            <div className="profile-card-heading">
              <span>01</span>
              <h2>{copy.auth.account.profileTitle}</h2>
            </div>
            <dl>
              <div>
                <dt>{copy.auth.account.name}</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>{copy.auth.account.email}</dt>
                <dd dir="ltr">{user.email}</dd>
              </div>
              <div>
                <dt>{copy.auth.account.memberSince}</dt>
                <dd>{joined}</dd>
              </div>
            </dl>
            <AccountLogout
              locale={locale}
              label={copy.auth.account.logout}
              loadingLabel={copy.auth.account.loggingOut}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
