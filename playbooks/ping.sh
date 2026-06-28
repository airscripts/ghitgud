#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Ping"
expect_exit_0 "ping succeeds" ghg ping

step "Ping --json"
expect_json_field "JSON has success=true" "success" "true" ghg ping
