#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() {
  :
}

teardown() {
  print_summary
}

trap teardown EXIT
setup

step "List Licenses"
expect_exit_0 "license list succeeds" gitfleet license list

step "List Licenses JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet license list --json

step "View License"
expect_exit_0 "license view succeeds" gitfleet license view mit

step "View License JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet license view mit --json

step "View Invalid License"
expect_exit_non0 "license view fails for invalid key" gitfleet license view nonexistent-license-key-xyz

step "Repo License List"
expect_exit_0 "repo license list succeeds" gitfleet repo license list --repo "$REPO"

step "Repo License List JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet repo license list --repo "$REPO" --json
