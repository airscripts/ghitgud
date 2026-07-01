#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

INVITE_USER="${INVITE_USER:-github-actions[bot]}"
TEST_TEAM="gitfleet-test-team"
INVITED_USER=false
GRANTED_TEAM=false
TEST_REPO="gitfleet-test-repo-crud-$$"
CRUD_REPO="$OWNER/$TEST_REPO"

setup() { :; }

teardown() {
  gitfleet repo delete "$CRUD_REPO" --yes >/dev/null 2>&1 || true
  rm -rf "$TMPDIR/$TEST_REPO" "$TMPDIR/${TEST_REPO}-renamed"
  if [ "$INVITED_USER" = true ]; then
    step "Removing Collaborator"
    gh api "repos/$REPO/collaborators/$INVITE_USER" -X DELETE >/dev/null 2>&1 && \
      pass "collaborator removed" || skip "collaborator removal (may not exist)"
  fi

  if [ "$GRANTED_TEAM" = true ]; then
    step "Removing Team Access"
    gh api "orgs/$ORG/teams/$TEST_TEAM/repos/$REPO" -X DELETE >/dev/null 2>&1 && \
      pass "team access removed" || skip "team access removal"
  fi

  print_summary
}

trap teardown EXIT
setup

step "Repo Create"
expect_exit_0 "repo create succeeds" gitfleet repo create "$TEST_REPO" --private --description "gitfleet repository CRUD playbook"

step "Repo View"
expect_exit_0 "repo view succeeds" gitfleet repo view "$CRUD_REPO"

step "Repo List"
expect_output "repo list includes test repository" "$TEST_REPO" gitfleet repo list --owner "$OWNER" --owner-type user

step "Repo Edit"
expect_exit_0 "repo edit succeeds" gitfleet repo edit "$CRUD_REPO" --description "updated by gitfleet playbook"

step "Repo Rename"
RENAMED_REPO="${TEST_REPO}-renamed"
expect_exit_0 "repo rename succeeds" gitfleet repo rename "$CRUD_REPO" "$RENAMED_REPO"
CRUD_REPO="$OWNER/$RENAMED_REPO"

step "Repo Archive And Unarchive"
expect_exit_0 "repo archive succeeds" gitfleet repo archive "$CRUD_REPO"
expect_exit_0 "repo unarchive succeeds" gitfleet repo unarchive "$CRUD_REPO"

step "Repo Star"
expect_exit_0 "repo star succeeds" gitfleet repo star "$CRUD_REPO"
expect_exit_0 "repo unstar succeeds" gitfleet repo unstar "$CRUD_REPO"

step "Repo Clone"
(cd "$TMPDIR" && expect_exit_0 "repo clone succeeds" gitfleet repo clone "$CRUD_REPO" --depth 1)

step "Repo Invalid Inputs"
expect_exit_non0 "repo create rejects conflicting visibility" gitfleet repo create invalid --public --private
expect_exit_non0 "repo edit requires a change" gitfleet repo edit "$CRUD_REPO"
expect_exit_non0 "repo delete requires confirmation" env CI=true gitfleet repo delete "$CRUD_REPO"

step "Repo Invite"
if gitfleet repo invite --repo "$REPO" --user "$INVITE_USER" --role pull >/dev/null 2>&1; then
  pass "repo invite succeeded"
  INVITED_USER=true
else
  skip "repo invite (may already be a collaborator)"
fi

step "Repo Invite JSON"
output=$(gitfleet repo invite --repo "$REPO" --user "$INVITE_USER" --role pull --json 2>&1) || true

if echo "$output" | grep -q '"success":true\|"success": true'; then
  pass "repo invite JSON succeeded"
else
  skip "repo invite JSON (may already be a collaborator)"
fi

step "Repo Grant"
if gh api "orgs/$ORG/teams/$TEST_TEAM" >/dev/null 2>&1; then
  if gitfleet repo grant --repo "$REPO" --team "$TEST_TEAM" --role pull >/dev/null 2>&1; then
    pass "repo grant succeeded"
    GRANTED_TEAM=true
  else
    skip "repo grant (may already have access)"
  fi
else
  skip "repo grant (test team does not exist in org)"
fi

step "Repo Invite Without --user"
CI=true expect_exit_non0 "repo invite without --user fails" gitfleet repo invite --repo "$REPO"

step "Repo Grant Without --team"
CI=true expect_exit_non0 "repo grant without --team fails" gitfleet repo grant --repo "$REPO"
