# Bytevia — Progress Log

## Plan
- 250 leads split into 9 research slices (A1..A9), each run by a parallel agent writing `research/A*.csv`.
- Merge → `leads.csv` / `leads.xlsx` (dedupe, renumber, messages, demo links).
- Template: `template/` (one engine + `presets.json` per niche). Generator: `node template/build.js`.
- Demos: `demos/<token>/`, screenshots: `screenshots/<token>-desktop.jpg|-mobile.jpg`.

## Slices
| Slice | Scope | Target | Status |
|---|---|---|---|
| A1 | UAE WhatsApp (Sharjah/Ajman/RAK/Al Ain/Fujairah/UAQ), mixed niches | 30 | running (relaunched 01:21 after first run stalled) |
| A2 | KSA 10 / Qatar 5 / Kuwait 5 WhatsApp | 20 | running (relaunched 01:21 after first run stalled) |
| A3 | UAE Instagram (Dubai/Abu Dhabi): clinics, salons, gyms, restaurants | 30 | running (relaunched 01:21 after first run stalled) |
| A4 | UAE Instagram (Dubai/Abu Dhabi): law/accounting, home services, real estate, restaurants | 30 | running (relaunched 01:21 after first run stalled) |
| A5 | KSA 20 / Qatar 5 / Kuwait 5 Instagram | 30 | running (relaunched 01:21 after first run stalled) |
| A6 | Netherlands Instagram | 30 | running (relaunched 01:21 after first run stalled) |
| A7 | Switzerland Instagram | 25 | running (relaunched 01:21 after first run stalled) |
| A8 | Germany / Austria Instagram | 25 | running (relaunched 01:21 after first run stalled) |
| A9 | Nordics 20 + Belgium/Luxembourg 10 Instagram | 30 | running (relaunched 01:21 after first run stalled) |

## Done
- brand kit unzipped to `brand/`
- template engine (`template/presets.js`, `template/build.js`), shared CSS + 29 Unsplash photos in `public/assets/`
- merge + messages (`template/merge.py`), screenshots (`template/shots.js`), pipeline `template/run_all.sh`
- deploy configs: `wrangler.toml`, `firebase.json`, `deploy.sh` (no Cloudflare/Firebase token found in env → user to connect repo to Cloudflare Pages via Git)

## Remaining
- research (agents running) → then `./template/run_all.sh` → QA → summary
- Resume: check which research/A*.csv are short of target and re-run only those slices

## Update 2026-11-15
- Round 1+2 research done: 235 unique rows (49 WhatsApp / 186 Instagram) -> leads.csv / leads.xlsx, 235 demos built + screenshots.
- Price in messages = local-currency equivalent of ~$850-900 (see PRICES in template/merge.py), no-deposit wording, click-to-send link column.
- Running: C1-C3 extra discovery (NL, DACH law/home, GCC) + 6 verify agents (Instagram activity -> research/verify_out_N.csv).
- BLOCKER: Cloudflare token injected in the session now belongs to another account (Icyounis1@gmail.com), not webna100 -> NOT deploying. bytevia-demos.pages.dev still serves the older 51-demo build.
- After agents finish: `python3 template/merge.py && node template/build.js --all && node template/shots.js && python3 template/merge.py --final`, then deploy once the right token is back.
