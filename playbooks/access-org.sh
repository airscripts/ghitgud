#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

INVITE_USER="${INVITE_USER:-github-actions[bot]}"
INVITED_MEMBER=false

setup() { :; }

teardown() {
  if [ "$INVITED_MEMBER" = true ]; then
    step "Removing Org Member"
    gitfleet access org remove --org "$ORG" --user "$INVITE_USER" >/dev/null 2>&1 && \
      pass "org member removed" || skip "org member removal (may not exist)"
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Org Members"
expect_exit_0 "org members succeeds" gitfleet access org members --org "$ORG"

step "List Org Members JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet access org members --org "$ORG"

step "Invite Org Member"
if gitfleet access org invite --org "$ORG" --user "$INVITE_USER" --role member >/dev/null 2>&1; then
  pass "org invite succeeded"
  INVITED_MEMBER=true
else
  skip "org invite (may already be a member)"
fi

step "Org Members Without --org"
CI=true expect_exit_non0 "org members without --org fails" gitfleet access org members

step "Org Invite Without --user"
CI=true expect_exit_non0 "org invite without --user fails" gitfleet access org invite --org "$ORG"
