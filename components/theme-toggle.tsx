"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

export function ThemeToggle({ label }: { label: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const current = root.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("roshan-theme", next);
  }

  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      aria-label={label}
      onClick={toggleTheme}
    >
      <span className="theme-icon theme-icon--sun">
        <SunIcon />
      </span>
      <span className="theme-icon theme-icon--moon">
        <MoonIcon />
      </span>
    </button>
  );
}
