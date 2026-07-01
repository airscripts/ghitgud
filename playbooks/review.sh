#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Review Threads (Needs REVIEW_PR)"
if [ -n "${REVIEW_PR:-}" ]; then
  expect_exit_0 "review threads succeeds" gitfleet review threads "$REVIEW_PR" --repo "$REPO"
else
  skip "review threads (set REVIEW_PR env var to test)"
fi

step "Review Threads Without PR Number"
expect_exit_non0 "review threads without PR fails" gitfleet review threads --repo "$REPO"

step "Review Comment Without --body"
CI=true expect_exit_non0 "review comment without body fails" gitfleet review comment 1 --repo "$REPO"
