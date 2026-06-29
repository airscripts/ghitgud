#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }

teardown() { print_summary; }
trap teardown EXIT
setup

step "Search Issues"
expect_exit_0 "search issues succeeds" ghg search issues "bug" --limit 5

step "Search Issues With Repo"
expect_exit_0 "search issues with repo succeeds" ghg search issues "test" --repo "$REPO" --limit 5

step "Search Issues JSON"
expect_json_field "search issues JSON has totalCount" "totalCount" "0" ghg search issues "nonexistentxyz123" --limit 1

step "Search Issues With State"
expect_exit_0 "search issues with state filter succeeds" ghg search issues "bug" --state open --limit 5

step "Search PRs"
expect_exit_0 "search prs succeeds" ghg search prs "fix" --limit 5

step "Search PRs With Repo"
expect_exit_0 "search prs with repo succeeds" ghg search prs "feature" --repo "$REPO" --limit 5

step "Search PRs JSON"
expect_json_field "search prs JSON has totalCount" "totalCount" "0" ghg search prs "nonexistentxyz123" --limit 1

step "Search PRs Merged State"
expect_exit_0 "search prs with merged state succeeds" ghg search prs "release" --state merged --limit 5

step "Search Repos"
expect_exit_0 "search repos succeeds" ghg search repos "ghitgud" --limit 5

step "Search Repos JSON"
expect_json_field "search repos JSON has totalCount" "totalCount" "0" ghg search repos "nonexistentxyz123repo" --limit 1

step "Search Repos With Language"
expect_exit_0 "search repos with language succeeds" ghg search repos "framework" --language typescript --limit 5

step "Search Code"
expect_exit_0 "search code succeeds" ghg search code "README" --repo "$REPO" --limit 5

step "Search Code JSON"
expect_json_field "search code JSON has totalCount" "totalCount" "0" ghg search code "nonexistentxyz123code" --limit 1

step "Search Commits"
expect_exit_0 "search commits succeeds" ghg search commits "initial" --repo "$REPO" --limit 5

step "Search Commits With Author"
expect_exit_0 "search commits with author succeeds" ghg search commits "fix" --repo "$REPO" --author octocat --limit 5

step "Search Commits JSON"
expect_json_field "search commits JSON has totalCount" "totalCount" "0" ghg search commits "nonexistentxyz123commit" --limit 1