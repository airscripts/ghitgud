#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

TEST_DISCUSSION_NUMBER=""
TEST_CATEGORY=""
DISCUSSION_CLOSED=false

setup() {
  if gitfleet discussion categories --repo "$REPO" --json 2>/dev/null | grep -q "slug"; then
    TEST_CATEGORY=$(gitfleet discussion categories --repo "$REPO" --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['slug'] if d else '')" 2>/dev/null || echo "")
  fi
}

teardown() {
  if [ -n "$TEST_DISCUSSION_NUMBER" ] && [ "$DISCUSSION_CLOSED" = false ]; then
    step "Closing Test Discussion"
    gitfleet discussion close "$TEST_DISCUSSION_NUMBER" --repo "$REPO" >/dev/null 2>&1 && \
      pass "discussion closed" || fail "discussion close failed"
  fi

  print_summary
}

trap teardown EXIT
setup

step "Discussion Categories"
if gitfleet discussion categories --repo "$REPO" >/dev/null 2>&1; then
  pass "discussion categories succeeded"
else
  skip "discussion categories (discussions may not be enabled)"
fi

step "Discussion List"
if gitfleet discussion list --repo "$REPO" >/dev/null 2>&1; then
  pass "discussion list succeeded"
else
  skip "discussion list (discussions may not be enabled)"
fi

if [ -n "$TEST_CATEGORY" ]; then
  step "Create Discussion"
  local output
  output=$(gitfleet discussion create --title "[noop] gitfleet test discussion" --category "$TEST_CATEGORY" --body "gitfleet playbook test" --repo "$REPO" --json 2>&1) || true

  if echo "$output" | grep -q '"success":true'; then
    pass "discussion create succeeded"
    TEST_DISCUSSION_NUMBER=$(echo "$output" | python3 -c "import sys,json; print(json.load(sys.stdin).get('number',''))" 2>/dev/null || echo "")
  else
    fail "discussion create failed"
  fi
else
  skip "discussion create (no category available)"
fi

if [ -n "$TEST_DISCUSSION_NUMBER" ]; then
  step "View Discussion"
  expect_exit_0 "discussion view succeeds" gitfleet discussion view "$TEST_DISCUSSION_NUMBER" --repo "$REPO"
else
  skip "discussion view (no test discussion)"
fi

if [ -n "$TEST_DISCUSSION_NUMBER" ]; then
  step "Comment On Discussion"
  expect_exit_0 "discussion comment succeeds" gitfleet discussion comment "$TEST_DISCUSSION_NUMBER" --body "gitfleet test comment" --repo "$REPO"
else
  skip "discussion comment (no test discussion)"
fi

if [ -n "$TEST_DISCUSSION_NUMBER" ]; then
  step "Close Discussion"
  expect_exit_0 "discussion close succeeds" gitfleet discussion close "$TEST_DISCUSSION_NUMBER" --repo "$REPO"
  DISCUSSION_CLOSED=true
else
  skip "discussion close (no test discussion)"
fi

step "Create Discussion Without --title"
expect_exit_non0 "discussion create without title fails" gitfleet discussion create --category "$TEST_CATEGORY" --body "test" --repo "$REPO"

step "View Discussion With Invalid Number"
expect_exit_non0 "discussion view with invalid number fails" gitfleet discussion view 9999999 --repo "$REPO"
