# Lokeify

A Shopify-style commerce platform for fashion brands, with a **3D fit room**, **AI photo try-on** and **size advice** built into every store.

- Merchants sign up, open a store and run it from **/admin** (products, orders, customers, online store, fit room & try-on, settings).
- Every store is live at **/s/&lt;store-address&gt;** with the full storefront: home page sections, collections, product pages, search, lookbook, bag, checkout, customer accounts, the 3D fit room (male and female avatars that stand and walk) and photo try-on.

## Run it

Needs **Node.js 22.13 or newer** (locally it uses Node's built-in SQLite, `node:sqlite`).

```bash
npm install
npm run dev
```

Open http://localhost:3000. On first run Lokeify creates `data/lokeify.db` and a demo store:

| | Login | Where |
|---|---|---|
| Demo merchant | `demo@lokeify.com` / `demo1234` | http://localhost:3000/login → /admin/crate |
| Demo customer | `sam@example.com` / `demo1234` | http://localhost:3000/s/crate/signin |

Or click **Start free** and create your own store.

## How it's built

| Path | What |
|---|---|
| `src/app/(marketing)` | Landing page |
| `src/app/(auth)` | Merchant sign-up / log-in |
| `src/app/admin/[shop]/…` | Merchant admin (Tailwind) — `src/admin/*` |
| `src/app/s/[shop]/…` | Storefront for each store — `src/storefront/*` (ported from crate-store) |
| `src/app/api/auth`, `api/shops` | Merchant accounts and stores |
| `src/app/api/admin/[shop]/…` | Admin API: products, orders, theme (draft → publish), settings, file uploads |
| `src/app/api/s/[shop]/…` | Storefront API: customer accounts, checkout, newsletter, photo try-on |
| `src/app/files/[shopId]/[name]` | Uploaded files (photos, .glb) |
| `src/server/*` | Database (`db.ts`), sessions and passwords (`auth.ts`, `crypto.ts`), data access (`shops.ts`), uploads (`files.ts`), demo seed (`seed.ts`), try-on providers (`tryon/provider.ts`) |

**Data**: one database with merchants, shops, products, customers, orders, uploaded files and newsletter subscribers. Every query is scoped to one shop. `db.ts` talks to either

- a local SQLite file, `data/lokeify.db` (the default; delete the `data` folder to start over), or
- a hosted [Turso](https://turso.tech) (libSQL) database over HTTP when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set. No extra packages either way.

**Files** (photos, `.glb` models) are stored in the database in 512 KB chunks and streamed back by `/files/…`, so they survive serverless deploys. The browser uploads big files in 3 MB pieces (Vercel's request limit is 4.5 MB): images up to 10 MB, 3D files up to 40 MB.

**Sessions**: signed, http-only cookies — `lk_m` for merchants, `lk_c_<shopId>` for each store's customers. Passwords use scrypt. The signing key comes from `LOKEIFY_SECRET`, or from a random secret generated once and kept in the database.

**Checkout** runs in test mode: the server prices the bag from the catalogue, takes the stock and records the order as paid; nothing is charged. Cancelling an order puts the stock back.

**Photo try-on**: each store chooses a service and pastes its own API key in **Admin → Fit room & try-on** (stored encrypted). `MODEL_API_KEY` (Meta), `FASHN_API_KEY` or `REPLICATE_API_TOKEN` act as a fallback key **for every store** — leave them out if you don't want to pay for other stores' try-ons.

## Environment (all optional locally; see `.env.example`)

```
TURSO_DATABASE_URL=libsql://your-db.turso.io   # hosted database (needed on Vercel)
TURSO_AUTH_TOKEN=...
LOKEIFY_SECRET=long-random-string              # session signing + secret encryption
MODEL_API_KEY=                                 # fallback Meta Model API key for all stores
```

## Deploy on Vercel

1. Import the GitHub repo in Vercel (framework: Next.js, no settings to change).
2. Storage → add **Turso** from the Marketplace and connect it to the project; it adds `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. (Or create a database at turso.tech and paste both variables.)
3. Add `LOKEIFY_SECRET` (any long random string) under Settings → Environment Variables.
4. Deploy. The first request creates the tables and the demo store.

Without a database the deployment still runs, in **demo mode**: data lives in the function's `/tmp` and disappears on cold starts (the admin shows a warning).

## Credits

3D avatars: see `public/models/CREDITS.txt`. The female avatar ("Emerald Elegance") is **CC-BY-NC 4.0 — non-commercial**: replace it or get the author's permission before a real store uses it.
