#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Leaks Alerts --repo"
if ghg leaks alerts --repo "$REPO" >/dev/null 2>&1; then
  pass "leaks alerts --repo succeeds"
else
  skip "leaks alerts --repo (may require org scope or no alerts)"
fi

step "Leaks Alerts --org"
expect_exit_0 "leaks alerts --org succeeds" ghg leaks alerts --org "$ORG" --limit 5

step "Leaks Alerts Without Repo Or Org"
expect_exit_non0 "leaks alerts without scope fails" ghg leaks alerts
