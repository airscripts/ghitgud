#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

LABEL_TEMPLATE="conventional"
PUSHED_LABELS=false

setup() {
  ghg labels pull --repo "$REPO" -t "$LABEL_TEMPLATE" >/dev/null 2>&1 || true
}

teardown() {
  if [ "$PUSHED_LABELS" = true ]; then
    step "Pruning Pushed Labels"
    ghg labels prune --yes --repo "$REPO" >/dev/null 2>&1 && pass "labels pruned" || fail "labels prune failed"
  fi

  print_summary
}

trap teardown EXIT
setup

step "List Labels"
expect_exit_0 "labels list succeeds" ghg labels list --repo "$REPO"

step "List Labels JSON"
expect_json_field "JSON has success=true" "success" "true" ghg labels list --repo "$REPO"

step "Pull Labels Template"
expect_exit_0 "labels pull succeeds" ghg labels pull --repo "$REPO" -t "$LABEL_TEMPLATE"

step "Push Labels"
if ghg labels push --repo "$REPO" -t "$LABEL_TEMPLATE" >/dev/null 2>&1; then
  pass "labels push succeeded"
  PUSHED_LABELS=true
else
  fail "labels push failed"
fi

step "Prune Labels With --dry-run"
expect_exit_0 "labels prune --dry-run succeeds" ghg labels prune --dry-run --repo "$REPO"

step "Prune Labels With --yes"
PUSHED_LABELS=false
expect_exit_0 "labels prune --yes succeeds" ghg labels prune --yes --repo "$REPO"

step "Push With Nonexistent Template"
expect_exit_non0 "labels push fails with bad template" ghg labels push --repo "$REPO" -t "nonexistent-template-xyz"
