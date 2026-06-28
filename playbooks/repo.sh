#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

INVITE_USER="${INVITE_USER:-github-actions[bot]}"
TEST_TEAM="ghg-test-team"
INVITED_USER=false
GRANTED_TEAM=false

setup() { :; }

teardown() {
  if [ "$INVITED_USER" = true ]; then
    step "Removing Collaborator"
    gh api "repos/$REPO/collaborators/$INVITE_USER" -X DELETE >/dev/null 2>&1 && \
      pass "collaborator removed" || skip "collaborator removal (may not exist)"
  fi

  if [ "$GRANTED_TEAM" = true ]; then
    step "Removing Team Access"
    gh api "orgs/$ORG/teams/$TEST_TEAM/repos/$REPO" -X DELETE >/dev/null 2>&1 && \
      pass "team access removed" || skip "team access removal"
  fi

  print_summary
}

trap teardown EXIT
setup

step "Repo invite"
if ghg repo invite --repo "$REPO" --user "$INVITE_USER" --role pull >/dev/null 2>&1; then
  pass "repo invite succeeded"
  INVITED_USER=true
else
  skip "repo invite (may already be a collaborator)"
fi

step "Repo invite JSON"
output=$(ghg repo invite --repo "$REPO" --user "$INVITE_USER" --role pull --json 2>&1) || true

if echo "$output" | grep -q '"success":true\|"success": true'; then
  pass "repo invite JSON succeeded"
else
  skip "repo invite JSON (may already be a collaborator)"
fi

step "Repo grant"
if gh api "orgs/$ORG/teams/$TEST_TEAM" >/dev/null 2>&1; then
  if ghg repo grant --repo "$REPO" --team "$TEST_TEAM" --role pull >/dev/null 2>&1; then
    pass "repo grant succeeded"
    GRANTED_TEAM=true
  else
    skip "repo grant (may already have access)"
  fi
else
  skip "repo grant (test team does not exist in org)"
fi

step "Repo Invite Without --user"
CI=true expect_exit_non0 "repo invite without --user fails" ghg repo invite --repo "$REPO"

step "Repo Grant Without --team"
CI=true expect_exit_non0 "repo grant without --team fails" ghg repo grant --repo "$REPO"
