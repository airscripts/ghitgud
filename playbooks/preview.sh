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

step "Preview Prompter List Types JSON"
expect_json_field "JSON has success=true" "success" "true" ghg preview prompter --json

step "Preview Single Type JSON"
expect_json_field "JSON has success=true" "success" "true" ghg preview prompter text --json

step "Preview Invalid Type"
expect_exit_non0 "preview prompter fails for invalid type" ghg preview prompter invalid_type