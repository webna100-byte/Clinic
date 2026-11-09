#!/usr/bin/env bash
# Deploy public/ to Cloudflare Pages (needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in env)
# or Firebase Hosting (needs FIREBASE_TOKEN or `firebase login`, and --project <id>).
set -euo pipefail
cd "$(dirname "$0")"
case "${1:-cloudflare}" in
  cloudflare) npx --yes wrangler@3 pages deploy public --project-name bytevia-demos --branch main ;;
  firebase)   npx --yes firebase-tools hosting:channel:deploy demos --expires 30d --project "${2:?firebase project id}" ;;
esac
