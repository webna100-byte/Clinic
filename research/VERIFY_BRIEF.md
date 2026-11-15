# Activity verification brief
Goal: for each Instagram account in your input file, decide whether the business is ACTIVE (posting recently), so the user doesn't message dead accounts. Read-only; never log in, follow, like or message.

For each row open the public profile (mcp__TinyFish__fetch_content on the instagram URL; if rate-limited use WebFetch/curl, or WebSearch `site:instagram.com <handle>` snippets which show "x months ago"). Determine:
- last_post: approximate date or "N weeks/months ago" of the most recent visible post/reel (from the page text or snippet). If you can't see any date say "unknown".
- followers and posts count if visible.
- status: `active` = a post within the last ~90 days; `stale` = last post older than ~6 months; `unclear` = between, or no date visible; `missing` = the profile doesn't exist / private / page not found.
Do not guess: if nothing is visible, use `unclear` and say why.

Write /home/user/Clinic/research/verify_out_<N>.csv (N = your chunk number), UTF-8, header:
lead_no,instagram,status,last_post,followers,posts,note
Append every 5 rows so progress is never lost. When done reply with counts per status only.
