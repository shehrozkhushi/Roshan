"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";

export function AccountLogout({
  locale,
  label,
  loadingLabel,
}: {
  locale: Locale;
  label: string;
  loadingLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.dispatchEvent(new Event("roshan-auth-changed"));
      router.push(`/${locale}/login`);
      router.refresh();
    }
  }

  return (
    <button
      className="button button--ink account-logout"
      type="button"
      disabled={loading}
      onClick={logout}
    >
      <span>{loading ? loadingLabel : label}</span>
      <ArrowIcon />
    </button>
  );
}
