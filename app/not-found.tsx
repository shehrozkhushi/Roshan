import Link from "next/link";
import { ArrowIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="not-found-code">404</span>
      <h1>That page has wandered off.</h1>
      <p>The link may be old, or the page may have moved.</p>
      <Link className="button button--ink" href="/en">
        Back home
        <ArrowIcon />
      </Link>
    </main>
  );
}
