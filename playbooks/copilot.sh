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

step "[noop] Detect Copilot CLI"
if command -v github-copilot-cli >/dev/null 2>&1; then
  expect_exit_0 "copilot detect succeeds" ghg copilot --help
else
  skip "Copilot CLI not installed, skipping run test"
  expect_exit_non0 "copilot run fails when not installed" ghg copilot suggest
fi