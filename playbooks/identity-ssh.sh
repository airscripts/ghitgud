#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List SSH Keys"
expect_exit_0 "ssh-key list succeeds" gitfleet identity ssh list

print_summary
