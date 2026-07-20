const DEFAULT_ORIGIN = "http://localhost:3000";

export function absoluteUrl(value?: string, fallback = DEFAULT_ORIGIN) {
  const candidate = value?.trim() || fallback;
  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(candidate)
    ? candidate
    : `http://${candidate}`;

  try {
    return new URL(withProtocol);
  } catch {
    return new URL(fallback);
  }
}

export function siteOrigin() {
  return absoluteUrl(process.env.NEXT_PUBLIC_SITE_URL).origin;
}
