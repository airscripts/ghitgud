#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

TEST_ISSUE_NUMBER=""
PARENT_ISSUE_NUMBER=""
CRUD_ISSUE_NUMBER=""

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
  for issue_num in $TEST_ISSUE_NUMBER $PARENT_ISSUE_NUMBER $CRUD_ISSUE_NUMBER; do
    if [ -n "$issue_num" ]; then
      gh api "repos/$REPO/issues/$issue_num" -X PATCH -f state=closed -f title="[noop] ghg playbook test issue" >/dev/null 2>&1 || true
    fi
  done

  print_summary
}

trap teardown EXIT
setup

step "Issue Create"
create_output=$(ghg issue create --repo "$REPO" --title "ghg-test-issue-crud" --body "Created by the issue CRUD playbook." --label noop --json 2>/dev/null || echo "")
CRUD_ISSUE_NUMBER=$(printf '%s' "$create_output" | python3 -c "import sys,json; print(json.load(sys.stdin).get('issue', {}).get('number', ''))" 2>/dev/null || echo "")

if [ -n "$CRUD_ISSUE_NUMBER" ]; then
  pass "issue create succeeds"
else
  fail "issue create failed"
fi

step "Issue List"
expect_exit_0 "issue list succeeds" ghg issue list --repo "$REPO" --state all --label noop --limit 10

step "Issue List Invalid State"
expect_exit_non0 "issue list rejects invalid state" ghg issue list --repo "$REPO" --state invalid

if [ -n "$CRUD_ISSUE_NUMBER" ]; then
  step "Issue View"
  expect_exit_0 "issue view succeeds" ghg issue view "$CRUD_ISSUE_NUMBER" --repo "$REPO"

  step "Issue Edit"
  expect_exit_0 "issue edit succeeds" ghg issue edit "$CRUD_ISSUE_NUMBER" --repo "$REPO" --title "ghg-test-issue-crud-edited" --body "Edited by the playbook."

  step "Issue Comment"
  expect_exit_0 "issue comment succeeds" ghg issue comment "$CRUD_ISSUE_NUMBER" --repo "$REPO" --body "Playbook comment."

  step "Issue Close And Reopen"
  expect_exit_0 "issue close succeeds" ghg issue close "$CRUD_ISSUE_NUMBER" --repo "$REPO"
  expect_exit_0 "issue reopen succeeds" ghg issue reopen "$CRUD_ISSUE_NUMBER" --repo "$REPO"

  step "Issue Lock And Unlock"
  expect_exit_0 "issue lock succeeds" ghg issue lock "$CRUD_ISSUE_NUMBER" --repo "$REPO"
  expect_exit_0 "issue unlock succeeds" ghg issue unlock "$CRUD_ISSUE_NUMBER" --repo "$REPO"
else
  skip "issue lifecycle (create failed)"
fi

step "Issue Status"
expect_exit_0 "issue status succeeds" ghg issue status --repo "$REPO"

step "Issue Edit Without Changes"
expect_exit_non0 "issue edit without changes fails" ghg issue edit "$TEST_ISSUE_NUMBER" --repo "$REPO"

step "Issue Delete Without Confirmation"
expect_exit_non0 "issue delete without --yes fails in JSON mode" ghg issue delete "$TEST_ISSUE_NUMBER" --repo "$REPO" --json

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
