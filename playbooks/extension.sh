#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Extensions"
expect_exit_0 "extension list succeeds" ghg extension list

step "Create Extension"
WS_NAME="ghg-test-extension"
expect_exit_0 "extension create succeeds" ghg extension create "$WS_NAME"

step "List Extensions After Create"
expect_exit_0 "extension list shows extension" ghg extension list

step "Exec Extension"
expect_exit_0 "extension exec succeeds" ghg extension exec "$WS_NAME"

step "Remove Extension"
expect_exit_0 "extension remove succeeds" ghg extension remove "$WS_NAME" --yes

print_summary