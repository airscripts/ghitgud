#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Activity"
output=$(ghg activity --repo "$REPO" 2>&1) || true

if echo "$output" | grep -qi "unprocessable"; then
  skip "activity (API returned unprocessable content for this repo)"
else
  if ghg activity --repo "$REPO" >/dev/null 2>&1; then
    pass "activity succeeds"
  else
    fail "activity failed"
  fi
fi

step "Activity --json"
output=$(ghg activity --repo "$REPO" --json 2>&1) || true

if echo "$output" | grep -qi "unprocessable"; then
  skip "activity --json (API returned unprocessable content for this repo)"
else
  expect_json_field "JSON has success=true" "success" "true" ghg activity --repo "$REPO" --json
fi