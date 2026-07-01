#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "Run List"
expect_exit_0 "run list succeeds" gitfleet pipeline run list --repo "$REPO" --limit 5

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

if [ -n "${RUN_ID:-}" ]; then
  step "Run debug"
  expect_exit_0 "run debug succeeds" gitfleet pipeline run debug "$RUN_ID" --repo "$REPO"
else
  step "Run Debug (Skipped — Set RUN_ID To Test)"
  skip "run debug (set RUN_ID env var to test)"
fi

step "Run Debug Without Run ID"
expect_exit_non0 "run debug without ID fails" gitfleet pipeline run debug --repo "$REPO"

step "Watch Run (skipped without RUN_ID)"
if [ -n "${RUN_ID:-}" ]; then
  expect_exit_0 "run watch succeeds" gitfleet pipeline run watch "$RUN_ID" --repo "$REPO"
else
  skip "run watch requires RUN_ID"
fi
