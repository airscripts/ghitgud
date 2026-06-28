#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

if [ -n "${RUN_ID:-}" ]; then
  step "Run debug"
  expect_exit_0 "run debug succeeds" ghg run debug "$RUN_ID" --repo "$REPO"
else
  step "Run Debug (Skipped — Set RUN_ID To Test)"
  skip "run debug (set RUN_ID env var to test)"
fi

step "Run Debug Without Run ID"
expect_exit_non0 "run debug without ID fails" ghg run debug --repo "$REPO"
