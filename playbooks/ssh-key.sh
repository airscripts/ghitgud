#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List SSH Keys"
expect_exit_0 "ssh-key list succeeds" ghg ssh-key list

print_summary