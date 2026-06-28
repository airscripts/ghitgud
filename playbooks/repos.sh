#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Repos inspect --org"
expect_exit_0 "repos inspect --org succeeds" ghg repos inspect --org "$ORG" --limit 5

step "Repos inspect --repos"
expect_exit_0 "repos inspect with single repo" ghg repos inspect --repos "$REPO"

step "Repos report --org"
expect_exit_0 "repos report succeeds" ghg repos report --org "$ORG" --limit 5

step "Repos govern --dry-run --org"
expect_exit_0 "repos govern --dry-run succeeds" ghg repos govern --dry-run --org "$ORG" --limit 5

step "Repos label --dry-run --org"
expect_exit_0 "repos label --dry-run succeeds" ghg repos label --dry-run --org "$ORG" --limit 5 -t conventional

step "Repos retire --dry-run --org"
expect_exit_0 "repos retire --dry-run succeeds" ghg repos retire --dry-run --org "$ORG" --limit 5

step "Repos clone --dry-run --org"
expect_exit_0 "repos clone --dry-run succeeds" ghg repos clone --dry-run --org "$ORG" --limit 5
