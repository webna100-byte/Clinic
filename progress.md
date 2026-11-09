# Bytevia — Progress Log

## Plan
- 250 leads split into 9 research slices (A1..A9), each run by a parallel agent writing `research/A*.csv`.
- Merge → `leads.csv` / `leads.xlsx` (dedupe, renumber, messages, demo links).
- Template: `template/` (one engine + `presets.json` per niche). Generator: `node template/build.js`.
- Demos: `demos/<token>/`, screenshots: `screenshots/<token>-desktop.jpg|-mobile.jpg`.

## Slices
| Slice | Scope | Target | Status |
|---|---|---|---|
| A1 | UAE WhatsApp (Sharjah/Ajman/RAK/Al Ain/Fujairah/UAQ), mixed niches | 30 | running |
| A2 | KSA 10 / Qatar 5 / Kuwait 5 WhatsApp | 20 | running |
| A3 | UAE Instagram (Dubai/Abu Dhabi): clinics, salons, gyms, restaurants | 30 | running |
| A4 | UAE Instagram (Dubai/Abu Dhabi): law/accounting, home services, real estate, restaurants | 30 | running |
| A5 | KSA 20 / Qatar 5 / Kuwait 5 Instagram | 30 | running |
| A6 | Netherlands Instagram | 30 | running |
| A7 | Switzerland Instagram | 25 | running |
| A8 | Germany / Austria Instagram | 25 | running |
| A9 | Nordics 20 + Belgium/Luxembourg 10 Instagram | 30 | running |

## Done
- brand kit unzipped to `brand/`
- template engine (`template/presets.js`, `template/build.js`), shared CSS + 29 Unsplash photos in `public/assets/`
- merge + messages (`template/merge.py`), screenshots (`template/shots.js`), pipeline `template/run_all.sh`
- deploy configs: `wrangler.toml`, `firebase.json`, `deploy.sh` (no Cloudflare/Firebase token found in env → user to connect repo to Cloudflare Pages via Git)

## Remaining
- research (agents running) → then `./template/run_all.sh` → QA → summary
- Resume: check which research/A*.csv are short of target and re-run only those slices
