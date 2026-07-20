import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AsteriskIcon } from "@/components/icons";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ur" ? "اکاؤنٹ بنائیں" : "Create account",
    robots: { index: false, follow: false },
  };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam;
  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/account`);
  const copy = getDictionary(locale);

  return (
    <section className="auth-page">
      <div className="shell auth-layout">
        <div className="auth-art auth-art--signup" aria-hidden="true">
          <span className="auth-art-disc" />
          <span className="auth-art-panel" />
          <span className="auth-art-orbit" />
          <AsteriskIcon />
          <small>RS / USER / 02</small>
        </div>
        <div className="auth-card">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {copy.auth.signup.eyebrow}
          </p>
          <h1>{copy.auth.signup.title}</h1>
          <p className="auth-intro">{copy.auth.signup.intro}</p>
          <AuthForm locale={locale} mode="signup" copy={copy.auth} />
        </div>
      </div>
    </section>
  );
}
