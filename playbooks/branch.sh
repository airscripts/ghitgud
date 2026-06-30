#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

PROTECTED_BRANCH="ghg-test-protection-$$"

setup() {
  : # Protection is created and removed within the playbook.
}

teardown() {
  step "Cleanup Branch Protection"
  ghg branch unprotect "$PROTECTED_BRANCH" --repo "$REPO" >/dev/null 2>&1 || true
  print_summary
}

trap teardown EXIT
setup

step "List Protection Rules"
expect_exit_0 "branch protection list succeeds" ghg branch protection --repo "$REPO"

step "Protect Branch"
expect_exit_0 "branch protect succeeds" ghg branch protect "$PROTECTED_BRANCH" --repo "$REPO" --required-reviews 1

step "List Protection After Protect"
expect_exit_0 "branch protection list shows rules" ghg branch protection --repo "$REPO"

step "Unprotect Branch"
expect_exit_0 "branch unprotect succeeds" ghg branch unprotect "$PROTECTED_BRANCH" --repo "$REPO"

step "Tag Protect"
expect_exit_0 "tag protect succeeds" ghg branch tag-protect "v*" --repo "$REPO"

step "List Protection After Tag Protect"
expect_exit_0 "branch protection list shows tag rules" ghg branch protection --repo "$REPO"

step "Tag Unprotect"
expect_exit_0 "tag unprotect succeeds" ghg branch tag-unprotect "v*" --repo "$REPO"