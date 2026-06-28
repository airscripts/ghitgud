#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Audit --org"
output=$(ghg audit --org "$ORG" --limit 5 2>&1) || true

if echo "$output" | grep -qi "not found\|unprocessable"; then
  skip "audit --org (org may not have audit log access)"
else
  if ghg audit --org "$ORG" --limit 5 >/dev/null 2>&1; then
    pass "audit --org succeeds"
  else
    fail "audit --org failed"
  fi
fi

step "Audit --org --json"
output=$(ghg audit --org "$ORG" --limit 5 --json 2>&1) || true

if echo "$output" | grep -qi "not found\|unprocessable"; then
  skip "audit --org --json (org may not have audit log access)"
else
  expect_json_field "JSON has success=true" "success" "true" ghg audit --org "$ORG" --limit 5 --json
fi

step "Audit Without --org"
expect_exit_non0 "audit without org fails" ghg audit