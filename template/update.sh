#!/usr/bin/env bash
# Incremental update: new research rows -> demos -> screenshots -> append to leads.csv/xlsx -> deploy.
# Existing rows in leads.csv are NEVER removed or changed.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 template/merge.py
node template/build.js --all
node template/shots.js
python3 template/merge.py --final
python3 template/deploy_cf.py
