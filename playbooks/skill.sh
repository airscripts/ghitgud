#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

SKILL_REPO="${GHG_SKILL_REPO:-airscripts/ghitgud}"

setup() {
  :
}

teardown() {
  ghg skill update ghg-test-skill >/dev/null 2>&1 || true
  print_summary
}

trap teardown EXIT
setup

step "List Skills (Empty)"
expect_exit_0 "skill list succeeds when empty" ghg skill list

step "List Skills JSON"
expect_json_field "JSON has success=true" "success" "true" ghg skill list --json

step "[noop] Preview Skill"
expect_exit_0 "skill preview succeeds" ghg skill preview "$SKILL_REPO"

step "[noop] Search Skills"
expect_exit_0 "skill search succeeds" ghg skill search "testing"

step "[noop] Search Skills JSON"
expect_json_field "JSON has success=true" "success" "true" ghg skill search "testing" --json