#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

SECRET_KEY="GHG_PLAYBOOK_TEST_KEY"
SECRET_VALUE="ghg-playbook-test-value"
SECRET_SET=false

setup() { :; }

teardown() {
  if [ "$SECRET_SET" = true ]; then
    step "Deleting Test Secret"
    ghg secret delete --name "$SECRET_KEY" --repo "$REPO" >/dev/null 2>&1 && \
      pass "test secret deleted" || skip "test secret deletion (may already be gone)"
  fi

  print_summary
}

trap teardown EXIT
setup

step "List Secrets"
expect_exit_0 "secret list succeeds" ghg secret list --repo "$REPO"

step "Set A Secret"
if ghg secret set --name "$SECRET_KEY" --value "$SECRET_VALUE" --repo "$REPO" >/dev/null 2>&1; then
  pass "secret set succeeded"
  SECRET_SET=true
else
  fail "secret set failed"
fi

if [ "$SECRET_SET" = true ]; then
  step "List Secrets After Set"
  expect_output "list shows new key" "$SECRET_KEY" ghg secret list --repo "$REPO"
else
  skip "secret list after set (secret was not set)"
fi

if [ "$SECRET_SET" = true ]; then
  step "Delete The Secret"
  expect_exit_0 "secret delete succeeds" ghg secret delete --name "$SECRET_KEY" --repo "$REPO"
  SECRET_SET=false
else
  skip "secret delete (secret was not set)"
fi

step "Set Secret Without --name"
expect_exit_non0 "secret set without name fails" ghg secret set --value test --repo "$REPO"

step "Delete Secret Without --name"
expect_exit_non0 "secret delete without name fails" ghg secret delete --repo "$REPO"
