#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Cross Repository Status"
expect_exit_0 "status succeeds" ghg status
expect_json_field "status returns JSON" success true ghg status

step "Organization Status"
expect_exit_0 "organization status succeeds" ghg status --org "$ORG"

step "Status Exclusions"
expect_exit_0 "status exclusions succeed" ghg status --exclude "$REPO"
