#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

LABEL_TEMPLATE="conventional"
LABEL_NAME="gitfleet-test-label"
PUSHED_LABELS=false

setup() {
  gitfleet label pull --repo "$REPO" -t "$LABEL_TEMPLATE" >/dev/null 2>&1 || true
}

teardown() {
  gitfleet label remove "$LABEL_NAME" --yes --repo "$REPO" >/dev/null 2>&1 || true

  if [ "$PUSHED_LABELS" = true ]; then
    step "Pruning Pushed Labels"
    gitfleet label prune --yes --repo "$REPO" >/dev/null 2>&1 && pass "labels pruned" || fail "labels prune failed"
  fi

  print_summary
}

trap teardown EXIT
setup

step "List Labels"
expect_exit_0 "labels list succeeds" gitfleet label list --repo "$REPO"

step "List Labels JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet label list --repo "$REPO"

step "Add Label"
expect_exit_0 "labels add succeeds" gitfleet label add "$LABEL_NAME" --color ff0000 --description "Test label from gitfleet" --repo "$REPO"

step "Add Label JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet label add "${LABEL_NAME}-2" --repo "$REPO" --json

step "Get Label"
expect_exit_0 "labels get succeeds" gitfleet label get "$LABEL_NAME" --repo "$REPO"

step "Get Label JSON"
expect_json_field "JSON has label name" "label" "name" gitfleet label get "$LABEL_NAME" --repo "$REPO" --json

step "Edit Label"
expect_exit_0 "labels edit succeeds" gitfleet label edit "$LABEL_NAME" --color 00ff00 --description "Updated test label" --repo "$REPO"

step "Edit Label JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet label edit "$LABEL_NAME" --new-name "${LABEL_NAME}-renamed" --repo "$REPO" --json

step "Remove Label Without --yes"
expect_exit_non0 "labels remove fails without --yes" gitfleet label remove "${LABEL_NAME}-renamed" --repo "$REPO"

step "Remove Label"
expect_exit_0 "labels remove succeeds" gitfleet label remove "${LABEL_NAME}-2" --yes --repo "$REPO"

step "Clone Labels"
expect_exit_0 "labels clone succeeds" gitfleet label clone --source "$REPO" --target "$REPO"

step "Clone Labels JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet label clone --source "$REPO" --target "$REPO" --json

step "Pull Labels Template"
expect_exit_0 "labels pull succeeds" gitfleet label pull --repo "$REPO" -t "$LABEL_TEMPLATE"

step "Push Labels"
if gitfleet label push --repo "$REPO" -t "$LABEL_TEMPLATE" >/dev/null 2>&1; then
  pass "labels push succeeded"
  PUSHED_LABELS=true
else
  fail "labels push failed"
fi

step "Prune Labels With --dry-run"
expect_exit_0 "labels prune --dry-run succeeds" gitfleet label prune --dry-run --repo "$REPO"

step "Prune Labels With --yes"
PUSHED_LABELS=false
expect_exit_0 "labels prune --yes succeeds" gitfleet label prune --yes --repo "$REPO"

step "Push With Nonexistent Template"
expect_exit_non0 "labels push fails with bad template" gitfleet label push --repo "$REPO" -t "nonexistent-template-xyz"
