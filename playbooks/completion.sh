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

step "Generate Bash Completion"
expect_exit_0 "completion generate bash succeeds" ghg completion generate --shell bash

step "Generate Zsh Completion"
expect_exit_0 "completion generate zsh succeeds" ghg completion generate --shell zsh

step "Generate Fish Completion"
expect_exit_0 "completion generate fish succeeds" ghg completion generate --shell fish

step "Generate Powershell Completion"
expect_exit_0 "completion generate powershell succeeds" ghg completion generate --shell powershell

step "Generate Completion JSON"
expect_json_field "JSON has success=true" "success" "true" ghg completion generate --shell bash --json

step "List Shells"
expect_exit_0 "completion list succeeds" ghg completion list

step "List Shells JSON"
expect_json_field "JSON has success=true" "success" "true" ghg completion list --json

step "Generate Invalid Shell"
expect_exit_non0 "completion generate fails for invalid shell" ghg completion generate --shell csh