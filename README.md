# Boss Level Bar Night

Signup site for Boss Level Bar Night: monthly nerd nights at bars on slow weeknights. Each city unlocks at 100 player signups.

## Structure

- `public/` – the site (static HTML, CSS, JS, pixel art, self-hosted Albert Sans)
- `api/signup.js` – POST signup: creates the Kit subscriber and tags them
- `api/count.js` – GET player count for a city (`/api/count?city=los-angeles`)
- `api/_kit.js` – shared Kit v4 helpers (not a route)

## Setup on Vercel

1. Import this repo into Vercel (framework: Other; output directory: `public`).
2. Add one environment variable: `KIT_API_KEY` = your Kit v4 API key (Kit → Settings → Developer).
3. Redeploy. Until the key is set, the form says signups open soon and the count stays hidden.

## Tags written to Kit

| Tag | Meaning |
| --- | --- |
| `city:<slug>` | Every signup, by city. LA-area towns map to `los-angeles` |
| `players:<slug>` | Players only. This is what the 0/100 counter counts |
| `role:player` / `role:bar` / `role:game-shop` | Who signed up |
| `main:<fighting|racing|retro|karaoke|trivia>` | Their pick in "Pick your main" |
| `founder-badges` | Collected every badge on the site before signing up |
| `source:bosslevel-site` | Came from this site |

To email one city when it unlocks: in Kit, filter subscribers by `city:<slug>`.

## Things to set before launch

- `public/app.js` → `CONFIG.discordUrl`: paste the Discord invite (the footer says "Join the list" until then)
- Tournament entry fees on the board are samples. Confirm them, and keep prizes fixed, announced in advance, and not paid out of entry fees.
