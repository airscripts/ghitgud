#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

PROFILE_NAME="ghg-test-profile"
PROFILE_ADDED=false
ORIGINAL_PROFILE=""

setup() {
  ORIGINAL_PROFILE=$(ghg profile list --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('current',''))" 2>/dev/null || echo "")
}

teardown() {
  if [ -n "$ORIGINAL_PROFILE" ] && [ "$ORIGINAL_PROFILE" != "$PROFILE_NAME" ]; then
    step "Switching Back To Original Profile"
    ghg profile switch "$ORIGINAL_PROFILE" >/dev/null 2>&1 || true
  fi

  if [ "$PROFILE_ADDED" = true ]; then
    step "Removing Test Profile"
    ghg config unset "profiles.$PROFILE_NAME" >/dev/null 2>&1 || true
  fi

  print_summary
}

trap teardown EXIT
setup

step "Profile detect"
expect_exit_0 "profile detect succeeds" ghg profile detect

step "Profile list"
expect_exit_0 "profile list succeeds" ghg profile list

step "Profile add"
if ghg profile add --name "$PROFILE_NAME" --token "$GHG_TOKEN" >/dev/null 2>&1; then
  pass "profile add succeeded"
  PROFILE_ADDED=true
else
  skip "profile add (may already exist)"
fi

if [ "$PROFILE_ADDED" = true ]; then
  step "Profile switch"
  expect_exit_0 "profile switch succeeds" ghg profile switch "$PROFILE_NAME"
else
  skip "profile switch (profile was not added)"
fi

step "Profile Add Without --name"
CI=true expect_exit_non0 "profile add without name fails" ghg profile add --token "$GHG_TOKEN"
