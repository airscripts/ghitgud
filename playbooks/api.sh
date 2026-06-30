#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Authenticated API Request"
expect_output "api user succeeds" "login" ghg api /user

step "API Jq Filter"
expect_exit_0 "api jq succeeds" ghg api /user --jq .login

step "API Pagination"
expect_exit_0 "api pagination succeeds" ghg api "/user/repos?per_page=1" --paginate

step "Reject External URL"
expect_exit_non0 "api rejects external URL" ghg api https://example.com
