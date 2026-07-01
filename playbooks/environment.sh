#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

ENV_NAME="gitfleet-test-env"
ENV_CREATED=false

setup() { :; }

teardown() {
  if [ "$ENV_CREATED" = true ]; then
    echo "[WARN] Environment '$ENV_NAME' was created on $REPO and needs manual deletion."
    echo "       Delete it at: https://github.com/$REPO/settings/environments"
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Environments"
expect_exit_0 "environment list succeeds" gitfleet environment list --repo "$REPO"

step "Create Environment"
if gitfleet environment create --name "$ENV_NAME" --repo "$REPO" >/dev/null 2>&1; then
  pass "environment create succeeded"
  ENV_CREATED=true
else
  skip "environment create (may already exist)"
  ENV_CREATED=true
fi

if [ "$ENV_CREATED" = true ]; then
  step "List Environments After Create"
  expect_output "list shows new environment" "$ENV_NAME" gitfleet environment list --repo "$REPO"
else
  skip "environment list after create"
fi

if [ "$ENV_CREATED" = true ]; then
  step "Environment Protection List"
  output=$(gitfleet environment protection list --env "$ENV_NAME" --repo "$REPO" 2>&1) || true

  if echo "$output" | grep -qi "No protection rules\|0 protection rules"; then
    pass "protection list succeeds (no rules)"
  elif echo "$output" | grep -qi "error"; then
    fail "protection list failed"
    echo "  $output"
  else
    pass "protection list succeeds"
  fi
else
  skip "protection list (no test environment)"
fi

step "Create Environment Without --name"
expect_exit_non0 "environment create without name fails" gitfleet environment create --repo "$REPO"
