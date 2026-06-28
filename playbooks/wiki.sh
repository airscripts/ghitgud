#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

WIKI_HOME_BACKUP="$TMPDIR/wiki-home-backup.md"
WIKI_TEST_PAGE="Ghg-Test-Page"
WIKI_HOME_EXISTS=false
WIKI_INITIALIZED=false
WIKI_CREATED=false

setup() {
  if ghg wiki list --repo "$REPO" >/dev/null 2>&1; then
    WIKI_INITIALIZED=true
    local home_content
    home_content=$(ghg wiki view Home --repo "$REPO" --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['page']['content'],end='')" 2>/dev/null) || true

    if [ -n "$home_content" ]; then
      WIKI_HOME_EXISTS=true
      echo "$home_content" > "$WIKI_HOME_BACKUP"
    fi

    ghg wiki view "$WIKI_TEST_PAGE" --repo "$REPO" >/dev/null 2>&1 && {
      ghg wiki delete "$WIKI_TEST_PAGE" --repo "$REPO" >/dev/null 2>&1 || true
    } || true
  else
    WIKI_INITIALIZED=false
  fi
}

teardown() {
  if [ "$WIKI_INITIALIZED" = true ]; then
    if [ "$WIKI_HOME_EXISTS" = true ] && [ -f "$WIKI_HOME_BACKUP" ]; then
      step "Reverting Home Wiki Page"
      ghg wiki edit Home --file "$WIKI_HOME_BACKUP" --repo "$REPO" >/dev/null 2>&1 && \
        pass "Home page restored" || fail "Home page restore failed"
    fi

    for page in "$WIKI_TEST_PAGE" "GhgTestNotes" "GhgTestExt" "GhgDupTest" "GhgDeleteTest" "Ghg-Test-Page"; do
      ghg wiki delete "$page" --repo "$REPO" >/dev/null 2>&1 || true
    done
  fi

  print_summary
}

trap teardown EXIT
setup

step "List Wiki Pages"
if [ "$WIKI_INITIALIZED" = true ]; then
  if ghg wiki list --repo "$REPO" >/dev/null 2>&1; then
    pass "wiki list succeeded"
    expect_output "wiki list shows Home" "Home" ghg wiki list --repo "$REPO"
  else
    fail "wiki list failed"
  fi
else
  skip "wiki list (wiki not initialized for this repo)"
fi

step "View Home Page"
if [ "$WIKI_INITIALIZED" = true ]; then
  if ghg wiki view Home --repo "$REPO" >/dev/null 2>&1; then
    pass "wiki view Home succeeded"
  else
    skip "wiki view Home (Home page may not exist)"
  fi
else
  skip "wiki view Home (wiki not initialized)"
fi

step "Create A New Wiki Page"
if [ "$WIKI_INITIALIZED" = true ]; then
  local_file="$TMPDIR/wiki-test-page.md"
  echo "# GHG Test Page Content" > "$local_file"

  if ghg wiki create "$WIKI_TEST_PAGE" --file "$local_file" --repo "$REPO" >/dev/null 2>&1; then
    pass "wiki create succeeded"
    WIKI_CREATED=true
  else
    output=$(ghg wiki create "$WIKI_TEST_PAGE" --file "$local_file" --repo "$REPO" 2>&1) || true
    if echo "$output" | grep -qi "already exists"; then
      skip "wiki create (page already exists from prior run)"
      WIKI_CREATED=true
    else
      fail "wiki create failed"
    fi
  fi
else
  skip "wiki create (wiki not initialized)"
fi

step "View Created Page"
if [ "$WIKI_INITIALIZED" = true ] && [ "$WIKI_CREATED" = true ]; then
  expect_output "view shows test content" "Ghg" ghg wiki view "$WIKI_TEST_PAGE" --repo "$REPO"
else
  skip "wiki view test page (wiki not initialized or page not created)"
fi

step "Edit Home Page"
if [ "$WIKI_INITIALIZED" = true ]; then
  local_file="$TMPDIR/wiki-edit-home.md"
  echo "Welcome to the wiki. (ghg playbook edit)" > "$local_file"

  if ghg wiki edit Home --file "$local_file" --repo "$REPO" >/dev/null 2>&1; then
    pass "wiki edit Home succeeded"
  else
    if ghg wiki create Home --file "$local_file" --repo "$REPO" >/dev/null 2>&1; then
      pass "wiki create Home (fallback) succeeded"
      WIKI_HOME_EXISTS=true
    else
      fail "wiki edit and create Home both failed"
    fi
  fi
else
  skip "wiki edit Home (wiki not initialized)"
fi

step "Verify Home Page Edit"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_output "Home page contains edit marker" "ghg playbook edit" ghg wiki view Home --repo "$REPO"
else
  skip "verify Home edit (wiki not initialized)"
fi

step "Create Page With Explicit Extension"
if [ "$WIKI_INITIALIZED" = true ]; then
  local_file="$TMPDIR/wiki-test-ext.md"
  echo "# Notes" > "$local_file"

  if ghg wiki create "GhgTestExt.md" --file "$local_file" --repo "$REPO" >/dev/null 2>&1; then
    pass "wiki create with extension succeeded"
  else
    skip "wiki create with extension (may already exist)"
  fi
else
  skip "wiki create extension (wiki not initialized)"
fi

step "List After Creating Pages"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_output "list shows test page" "Ghg" ghg wiki list --repo "$REPO"
else
  skip "wiki list after create (wiki not initialized)"
fi

step "List JSON Output"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_json_field "JSON has success=true" "success" "true" ghg wiki list --repo "$REPO" --json
else
  skip "wiki list JSON (wiki not initialized)"
fi

step "View JSON Output"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_json_field "JSON has success=true" "success" "true" ghg wiki view Home --repo "$REPO" --json
else
  skip "wiki view JSON (wiki not initialized)"
fi

step "View Nonexistent Page"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_output "reports not found" "not found" ghg wiki view DoesNotExist999 --repo "$REPO"
else
  skip "wiki view nonexistent (wiki not initialized)"
fi

step "Create Duplicate Page"
if [ "$WIKI_INITIALIZED" = true ]; then
  local_file="$TMPDIR/wiki-dup.md"
  echo "# Dup" > "$local_file"
  ghg wiki create "GhgDupTest" --file "$local_file" --repo "$REPO" >/dev/null 2>&1 || true
  expect_output "reports already exists" "already exists" ghg wiki create "GhgDupTest" --file "$local_file" --repo "$REPO"
else
  skip "wiki create duplicate (wiki not initialized)"
fi

step "View With Invalid Title"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_output "rejects invalid title" "Invalid wiki page title" ghg wiki view "bad/name" --repo "$REPO"
else
  skip "wiki invalid title (wiki not initialized)"
fi

step "Edit With Missing Source File"
expect_output "reports file not found" "not found" ghg wiki edit Home --file "/tmp/ghg-nonexistent-file-99999.md" --repo "$REPO"

step "Delete Wiki Page"
if [ "$WIKI_INITIALIZED" = true ]; then
  local_file="$TMPDIR/wiki-delete-test.md"
  echo "# Delete Me" > "$local_file"
  ghg wiki create "GhgDeleteTest" --file "$local_file" --repo "$REPO" >/dev/null 2>&1 || true

  if ghg wiki delete "GhgDeleteTest" --repo "$REPO" >/dev/null 2>&1; then
    pass "wiki delete succeeded"
  else
    fail "wiki delete failed"
  fi
else
  skip "wiki delete (wiki not initialized)"
fi

step "Verify Deleted Page Is Gone"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_output "reports not found" "not found" ghg wiki view GhgDeleteTest --repo "$REPO"
else
  skip "wiki verify delete (wiki not initialized)"
fi

step "Delete Nonexistent Page"
if [ "$WIKI_INITIALIZED" = true ]; then
  expect_output "reports not found" "not found" ghg wiki delete DoesNotExist999 --repo "$REPO"
else
  skip "wiki delete nonexistent (wiki not initialized)"
fi

step "List On Nonexistent Repo"
if ghg wiki list --repo "ghost-org-99999/nonexistent-repo-99999" >/dev/null 2>&1; then
  fail "expected non-zero exit for nonexistent repo"
else
  pass "wiki list on nonexistent repo fails"
fi
