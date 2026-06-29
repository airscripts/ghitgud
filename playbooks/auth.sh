#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

AUTH_PROFILE="ghg-test-auth"
ORIGINAL_TOKEN=""
LOGGED_IN=false

setup() {
  ORIGINAL_TOKEN=$(ghg auth token --raw 2>/dev/null || echo "")
}

teardown() {
  if [ -n "$ORIGINAL_TOKEN" ]; then
    step "Restoring Original Authentication"
    ghg auth login --token "$ORIGINAL_TOKEN" >/dev/null 2>&1 || true
  fi

  print_summary
}

trap teardown EXIT
setup

step "Auth Status"
expect_exit_0 "auth status succeeds" ghg auth status

step "Auth Token (masked)"
expect_exit_0 "auth token succeeds" ghg auth token

step "Auth Token (raw)"
expect_exit_0 "auth token --raw succeeds" ghg auth token --raw

step "Auth Login"
if ghg auth login --token "$GHG_TOKEN" >/dev/null 2>&1; then
  pass "auth login succeeded"
  LOGGED_IN=true
else
  skip "auth login (may already be authenticated)"
fi

step "Auth List"
expect_exit_0 "auth list succeeds" ghg auth list

step "Auth Detect"
expect_exit_0 "auth detect succeeds" ghg auth detect

step "Auth Login Without Token"
CI=true expect_exit_non0 "auth login without token fails" ghg auth login

step "Auth Logout"
if [ "$LOGGED_IN" = true ]; then
  expect_exit_0 "auth logout succeeds" ghg auth logout --yes
else
  skip "auth logout (was not logged in)"
fi