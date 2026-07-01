#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Compliance Check --org"
expect_exit_0 "compliance check --org succeeds" gitfleet security compliance check --org "$ORG" --limit 5

step "Compliance Check --repo"
expect_exit_0 "compliance check --repo succeeds" gitfleet security compliance check --repos "$REPO"

step "Compliance Check Without Scope"
expect_exit_non0 "compliance check without scope fails" gitfleet security compliance check
