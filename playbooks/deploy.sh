#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

DEPLOYMENT_ID=""

setup() {
  : # Deployments are created and cleaned up within the playbook.
}

teardown() {
  if [ -n "$DEPLOYMENT_ID" ]; then
    step "Cleanup Deployment"
    gitfleet deploy status-create "$DEPLOYMENT_ID" --state inactive --repo "$REPO" >/dev/null 2>&1 || true
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Deployments"
expect_exit_0 "deployment list succeeds" gitfleet deploy list --repo "$REPO"

step "Create Deployment"
CREATE_JSON=$(gitfleet deploy create --ref main --environment gitfleet-test-production --repo "$REPO" --json)
DEPLOYMENT_ID=$(echo "$CREATE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("deployment",{}).get("id",""))')
if [ -n "$DEPLOYMENT_ID" ]; then
  pass "deployment create succeeds"
else
  fail "deployment create did not return an id"
fi

step "View Deployment"
expect_exit_0 "deployment view succeeds" gitfleet deploy view "$DEPLOYMENT_ID" --repo "$REPO"

step "List Deployment Statuses"
expect_exit_0 "deployment status succeeds" gitfleet deploy status "$DEPLOYMENT_ID" --repo "$REPO"

step "Create Deployment Status"
expect_exit_0 "deployment status-create succeeds" gitfleet deploy status-create "$DEPLOYMENT_ID" --state success --repo "$REPO" --description "gitfleet test deployment"

step "Set Deployment Inactive"
expect_exit_0 "deployment status-create inactive succeeds" gitfleet deploy status-create "$DEPLOYMENT_ID" --state inactive --repo "$REPO"
DEPLOYMENT_ID=""

step "List With Environment Filter"
expect_exit_0 "deployment list with environment filter" gitfleet deploy list --repo "$REPO" --environment production
