#!/usr/bin/env bash
# Full pipeline: merge research → build all demos → screenshots → final sheet
set -euo pipefail
cd "$(dirname "$0")/.."
python3 template/merge.py
node template/build.js --all
node template/shots.js
python3 template/merge.py --final
