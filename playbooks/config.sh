#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

# This playbook saves and restores the token. It sets a temporary value
# and immediately restores it, so the user's real token is never lost.
CONFIG_ORIGINAL_TOKEN=""

setup() {
  # Extract just the token value from the config get output
  CONFIG_ORIGINAL_TOKEN=$(ghg config get token 2>/dev/null | grep -oP 'token\s+\K\S+' || true)
}

teardown() {
  if [ -n "$CONFIG_ORIGINAL_TOKEN" ]; then
    step "Restoring Original Token"
    if ghg config set token "$CONFIG_ORIGINAL_TOKEN" >/dev/null 2>&1; then
      pass "original token restored"
    else
      fail "original token restore failed"
    fi
  fi

  print_summary
}

trap teardown EXIT
setup

step "Config Get"
expect_exit_0 "config get succeeds" ghg config get token

step "Config Set"
TEMP_TOKEN="ghg_playbook_test_token"
if ghg config set token "$TEMP_TOKEN" >/dev/null 2>&1; then
  pass "config set succeeded"

  if ghg config set token "$CONFIG_ORIGINAL_TOKEN" >/dev/null 2>&1; then
    pass "original token restored"
  else
    fail "original token restore failed"
  fi
else
  fail "config set failed"
fi

step "Config Get After Restore"
expect_output "config get shows restored token" "ghp_" ghg config get token
