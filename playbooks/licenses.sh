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
expect_exit_0 "licenses list succeeds" ghg licenses list

step "List Licenses JSON"
expect_json_field "JSON has success=true" "success" "true" ghg licenses list --json

step "View License"
expect_exit_0 "licenses view succeeds" ghg licenses view mit

step "View License JSON"
expect_json_field "JSON has success=true" "success" "true" ghg licenses view mit --json

step "View Invalid License"
expect_exit_non0 "licenses view fails for invalid key" ghg licenses view nonexistent-license-key-xyz

step "Repo License List"
expect_exit_0 "repo license list succeeds" ghg repo license list --repo "$REPO"

step "Repo License List JSON"
expect_json_field "JSON has success=true" "success" "true" ghg repo license list --repo "$REPO" --json