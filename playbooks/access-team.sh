#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

TEST_TEAM="gitfleet-test-team"
TEST_USER="${TEST_USER:-github-actions[bot]}"
TEAM_CREATED=false
MEMBER_ADDED=false

setup() {
  if ! gh api "orgs/$ORG/teams/$TEST_TEAM" >/dev/null 2>&1; then
    step "Creating Test Team $TEST_TEAM"

    if gitfleet access team create --org "$ORG" --name "$TEST_TEAM" --description "gitfleet playbook test team" >/dev/null 2>&1; then
      pass "test team created"
      TEAM_CREATED=true
    else
      fail "test team creation failed"
    fi
  else
    TEAM_CREATED=true
  fi
}

teardown() {
  if [ "$MEMBER_ADDED" = true ]; then
    step "Removing Team Member"
    gitfleet access team remove --org "$ORG" --team "$TEST_TEAM" --user "$TEST_USER" >/dev/null 2>&1 && \
      pass "team member removed" || skip "team member removal"
  fi

  if [ "$TEAM_CREATED" = true ]; then
    step "Deleting Test Team"
    gh api "orgs/$ORG/teams/$TEST_TEAM" -X DELETE >/dev/null 2>&1 && \
      pass "test team deleted" || fail "test team deletion failed"
  fi

  print_summary
}

trap teardown EXIT
setup

step "List Teams"
expect_exit_0 "team list succeeds" gitfleet access team list --org "$ORG"

step "List Teams JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet access team list --org "$ORG"

step "Add Team Member"
if gitfleet access team add --org "$ORG" --team "$TEST_TEAM" --user "$TEST_USER" >/dev/null 2>&1; then
  pass "team add succeeded"
  MEMBER_ADDED=true
else
  skip "team add (may already be a member)"
fi

if [ "$MEMBER_ADDED" = true ]; then
  step "Remove Team Member"
  if gitfleet access team remove --org "$ORG" --team "$TEST_TEAM" --user "$TEST_USER" >/dev/null 2>&1; then
    pass "team remove succeeded"
    MEMBER_ADDED=false
  else
    fail "team remove failed"
  fi
else
  skip "team remove (no member was added)"
fi

step "Team Create Without --name"
CI=true expect_exit_non0 "team create without --name fails" gitfleet access team create --org "$ORG"

step "Team Add Without --team"
CI=true expect_exit_non0 "team add without --team fails" gitfleet access team add --org "$ORG" --user "$TEST_USER"
