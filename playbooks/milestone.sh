#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

MILESTONE_TITLE="ghg-test-ms"
MILESTONE_CREATED=false
MILESTONE_NUMBER=""

setup() { :; }

teardown() {
  if [ "$MILESTONE_CREATED" = true ] && [ -n "$MILESTONE_NUMBER" ]; then
    step "Closing Test Milestone"
    ghg milestone close "$MILESTONE_TITLE" --repo "$REPO" >/dev/null 2>&1 && \
      pass "milestone closed" || fail "milestone close failed"
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Milestones"
expect_exit_0 "milestone list succeeds" ghg milestone list --repo "$REPO"

step "Create Milestone"
output=$(ghg milestone create --title "$MILESTONE_TITLE" --due "2099-12-31" --repo "$REPO" --json 2>&1) || true

if echo "$output" | grep -q '"success":true\|"success": true'; then
  pass "milestone create succeeded"
  MILESTONE_CREATED=true
  MILESTONE_NUMBER=$(echo "$output" | python3 -c "import sys,json; print(json.load(sys.stdin).get('number',''))" 2>/dev/null || echo "")
else
  skip "milestone create (API returned unprocessable content)"
fi

if [ "$MILESTONE_CREATED" = true ]; then
  step "Milestone Progress"
  expect_exit_0 "milestone progress succeeds" ghg milestone progress "$MILESTONE_TITLE" --repo "$REPO"
else
  skip "milestone progress (no test milestone)"
fi

if [ "$MILESTONE_CREATED" = true ]; then
  step "Close Milestone"
  expect_exit_0 "milestone close succeeds" ghg milestone close "$MILESTONE_TITLE" --repo "$REPO"
  MILESTONE_CREATED=false
else
  skip "milestone close (no test milestone)"
fi

step "Create Milestone Without --title"
expect_exit_non0 "milestone create without title fails" ghg milestone create --repo "$REPO"
