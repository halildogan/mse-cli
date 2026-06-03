#!/usr/bin/env bash
#
# Curated command sequence for recording a terminal demo of mse-cli.
#
# Record it with asciinema, then convert to an animated SVG:
#   asciinema rec --command "bash scripts/demo.sh" demo.cast
#   npx svg-term-cli --in demo.cast --out assets/demo.svg --window --width 84
#
# Or regenerate the committed cast + SVG directly (no asciinema/TTY needed):
#   npm run build
#   node scripts/make-demo-cast.mjs
#   npx svg-term-cli --in assets/demo.cast --out assets/demo.svg --window --width 84
#
set -euo pipefail

MSE="${MSE:-node dist/bin/mse.js}"
export FORCE_COLOR=3

step() {
  printf '\033[32m$\033[0m %s\n' "$1"
  eval "$2"
  echo
  sleep 1.4
}

step 'mse "start freelancing as a developer" --seed 42' \
  "$MSE \"start freelancing as a developer\" --seed 42"

step 'mse "should I invest in an index fund" --seed 7' \
  "$MSE \"should I invest in an index fund\" --seed 7"

step 'mse init --api-key sk-demo-… --model gpt-4o' \
  "$MSE init --api-key sk-demo-1a2b3c4d5e6f --model gpt-4o"

step 'mse config' \
  "$MSE config"
