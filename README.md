# Roshan Studio

A polished bilingual full-stack studio website built with Next.js App Router and TypeScript.

## Features

- English and Urdu routes with proper LTR/RTL layouts
- Persistent light, dark, and system-aware color theme
- Responsive homepage, about, journal, article, and contact pages
- Filterable bilingual journal backed by API route handlers
- MongoDB-backed user signup, login, logout, and protected account pages
- Revocable HTTP-only sessions with bcrypt password hashing
- Validated contact API with honeypot, request limits, MongoDB persistence, and Gmail notifications
- Local, optimized hero artwork with no external image dependency
- Accessible navigation, focus states, skip link, and reduced-motion support

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to English; Urdu is available at `/ur`.

Create `.env.local` before using authentication and email delivery:

```dotenv
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.example.mongodb.net/
MONGODB_DB=roshan_studio
APP_ORIGIN=http://localhost:3000
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
CONTACT_TO_EMAIL=contact@example.com
```

Enable 2-Step Verification on the sending Google account and create a Google
App Password for `GMAIL_APP_PASSWORD`; do not use or commit the normal account
password. `CONTACT_TO_EMAIL` is optional and defaults to `GMAIL_USER`.

## Backend

- `GET /api/posts?lang=en` returns journal posts.
- `GET /api/posts/:slug?lang=ur` returns a localized post.
- `POST /api/contact` validates and stores enquiries.
- `GET /api/contact` returns a health/status response and never exposes enquiries.
- `POST /api/auth/signup` creates a normal user account and session.
- `POST /api/auth/login` verifies a user and creates a session.
- `GET /api/auth/me` returns only the current safe user profile.
- `POST /api/auth/logout` revokes the current session.

When `MONGODB_URI` is configured, contact submissions are written to the
`contact_submissions` MongoDB collection and are never silently redirected to
local storage after a database error. Without `MONGODB_URI`, development uses
`data/contact-submissions.local.json`; `CONTACT_STORAGE_PATH` can change that
fallback path. A successful contact response is returned only after the
submission is stored and its Gmail notification is accepted by SMTP.

Authentication uses the `users` and `sessions` MongoDB collections. There are no admin roles. Session cookies are HTTP-only, same-site, database-revocable, and secure in production.
