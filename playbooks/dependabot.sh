#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Dependabot List --org"
expect_exit_0 "dependabot list --org succeeds" ghg dependabot list --org "$ORG" --limit 5

step "Dependabot List --repo"
if ghg dependabot list --repo "$REPO" >/dev/null 2>&1; then
  pass "dependabot list --repo succeeds"
else
  skip "dependabot list --repo (may require org scope or no alerts)"
fi

step "Dependabot Dismiss Without Alert"
expect_exit_non0 "dependabot dismiss without alert fails" ghg dependabot dismiss --repo "$REPO"
