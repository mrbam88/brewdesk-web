# brewdesk-web

BrewDesk on the web — free map of work spots, no account.

This is a standalone Next.js app. It is not part of `bamware-web` (that stays
the marketing site).

Same venue engine as the iPhone app:
[`https://venuekit-ashen.vercel.app`](https://venuekit-ashen.vercel.app)
([bamware-venue-engine](https://github.com/mrbam88/bamware-venue-engine)).

No accounts, no login cookies, no IAP, no UGC, no save.

## What you get

- A map of nearby work spots (Leaflet + OpenStreetMap tiles — no map API key)
- A ranked list beside the map (under it on a phone)
- Ranking is the engine's `workScore`, shown as **Work Fit** — same number iOS
  uses (laptop policy, seating, Wi-Fi, noise). This app does not invent a score.
- Tap a pin or a row to open the spot: Work Fit plus the four work-fit pieces,
  each with source and observation date. **← Map** goes back.

Location is optional. If the browser shares it, the map centers there. If not,
Union Square, NYC (the engine README / iOS coverage center).

## Run locally

Needs Node 20+ (this repo was scaffolded on Node 22).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page fetches
`GET /v1/venues?lat=…&lng=…&sort=work_score` **from the browser**.

```bash
npm run build   # production compile
```

Optional: copy `.env.example` to `.env.local` to point at another engine
origin. The default is the live API. No secrets are required.

## Engine contract

Do not invent a new API. Nearby listing is the public, unauthenticated route
the native client already uses:

| | |
|---|---|
| Method | `GET /v1/venues` |
| Query | `lat`, `lng`, `radius_m` (default 2500 here), `limit`, `sort=work_score` |
| Envelope | `{ count, venues, meta: { coverage } }` |
| Detail | `GET /v1/venues/:id` → `{ venue, observations }` |

`workScore` on each venue is Work Fit. Attributes carry `value`, `source`,
`confidence`, and `observedAt`.

The live engine already sends `Access-Control-Allow-Origin: *`
(`app.use(cors())` in bamware-venue-engine), so `http://localhost:3000` works
today. If that allow-list is ever tightened, the origin that must stay allowed
is local Next (`http://localhost:3000`).
