#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List GPG Keys"
expect_exit_0 "gpg-key list succeeds" gitfleet identity gpg list

print_summary
