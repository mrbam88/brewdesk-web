# brewdesk-web

BrewDesk on the web — free map of work spots, no account.

This is a standalone Next.js app. It is not part of `bamware-web` (that stays
the marketing site).

v1 talks to the same venue engine the iPhone app uses:
[`https://venuekit-ashen.vercel.app`](https://venuekit-ashen.vercel.app)
([bamware-venue-engine](https://github.com/mrbam88/bamware-venue-engine)).
This cut is only the app shell plus a throwaway page that asks the engine for
nearby spots. Map, ranked list, spot detail, and Vercel deploy are later
tickets.

No accounts, no login cookies, no IAP, no UGC, no save.

## Run locally

Needs Node 20+ (this repo was scaffolded on Node 22).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page fetches
`GET /v1/venues?lat=40.7359&lng=-73.9911` **from the browser** (Union Square —
the viewport in the engine README) and lists real nearby results.

```bash
npm run build   # production compile
```

Optional: copy `.env.example` to `.env.local` to point at another engine
origin. The default is the live API.

## Engine contract

Do not invent a new API. Nearby listing is the public, unauthenticated route
the native client already uses:

| | |
|---|---|
| Method | `GET /v1/venues` |
| Query | `lat`, `lng`, `radius_m` (default 2000), `limit` (default 50, max 200) |
| Body | none |
| Envelope | `{ count, venues, meta: { coverage } }` |

`POST /v1/venues/search` is the same query in a JSON body (privacy channel).
This probe uses the GET form so it stays a simple request.

The live engine already sends `Access-Control-Allow-Origin: *` (`app.use(cors())`
in bamware-venue-engine), so `http://localhost:3000` works today. If that
allow-list is ever tightened, the origin that must stay allowed is local Next
(`http://localhost:3000`).
