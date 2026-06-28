#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

TEST_ISSUE_NUMBER=""
PARENT_ISSUE_NUMBER=""

setup() {
  local body='{"title":"[noop] ghg playbook test issue","body":"This issue is auto-created and auto-closed by the ghg playbook.","labels":["noop"]}'
  TEST_ISSUE_NUMBER=$(gh api "repos/$REPO/issues" -X POST --input - <<< "$body" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['number'])" 2>/dev/null || echo "")

  if [ -n "$TEST_ISSUE_NUMBER" ]; then
    pass "test issue #$TEST_ISSUE_NUMBER created"
  else
    skip "could not create test issue (tests requiring issues will be skipped)"
  fi
}

teardown() {
  for issue_num in $TEST_ISSUE_NUMBER $PARENT_ISSUE_NUMBER; do
    if [ -n "$issue_num" ]; then
      gh api "repos/$REPO/issues/$issue_num" -X PATCH -f state=closed -f title="[noop] ghg playbook test issue" >/dev/null 2>&1 || true
    fi
  done

  print_summary
}

trap teardown EXIT
setup

if [ -n "$TEST_ISSUE_NUMBER" ]; then
  step "Issue Subtasks"
  expect_exit_0 "issue subtasks succeeds" ghg issue subtasks "$TEST_ISSUE_NUMBER" --repo "$REPO"
else
  skip "issue subtasks (no test issue)"
fi

if [ -n "$TEST_ISSUE_NUMBER" ]; then
  body='{"title":"[noop] ghg parent test issue","body":"Parent issue for ghg playbook.","labels":["noop"]}'
  PARENT_ISSUE_NUMBER=$(gh api "repos/$REPO/issues" -X POST --input - <<< "$body" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['number'])" 2>/dev/null || echo "")

  if [ -n "$PARENT_ISSUE_NUMBER" ]; then
    step "Issue Parent"
    expect_exit_0 "issue parent succeeds" ghg issue parent "$TEST_ISSUE_NUMBER" --parent "$PARENT_ISSUE_NUMBER" --repo "$REPO"
  else
    skip "issue parent (could not create parent issue)"
  fi
else
  skip "issue parent (no test issue)"
fi

step "Issue Subtasks Without Issue Number"
expect_exit_non0 "issue subtasks without number fails" ghg issue subtasks --repo "$REPO"

step "Issue Parent Without --parent"
expect_exit_non0 "issue parent without --parent fails" ghg issue parent "$TEST_ISSUE_NUMBER" --repo "$REPO"
