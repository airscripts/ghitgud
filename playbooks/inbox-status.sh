#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Cross Repository Status"
expect_exit_0 "status succeeds" gitfleet inbox status
expect_json_field "status returns JSON" success true gitfleet inbox status

step "Organization Status"
expect_exit_0 "organization status succeeds" gitfleet inbox status --org "$ORG"

step "Status Exclusions"
expect_exit_0 "status exclusions succeed" gitfleet inbox status --exclude "$REPO"
