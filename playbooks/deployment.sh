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
    ghg deployment status-create "$DEPLOYMENT_ID" --state inactive --repo "$REPO" >/dev/null 2>&1 || true
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Deployments"
expect_exit_0 "deployment list succeeds" ghg deployment list --repo "$REPO"

step "Create Deployment"
CREATE_JSON=$(ghg deployment create --ref main --environment ghg-test-production --repo "$REPO" --json)
DEPLOYMENT_ID=$(echo "$CREATE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("deployment",{}).get("id",""))')
if [ -n "$DEPLOYMENT_ID" ]; then
  pass "deployment create succeeds"
else
  fail "deployment create did not return an id"
fi

step "View Deployment"
expect_exit_0 "deployment view succeeds" ghg deployment view "$DEPLOYMENT_ID" --repo "$REPO"

step "List Deployment Statuses"
expect_exit_0 "deployment status succeeds" ghg deployment status "$DEPLOYMENT_ID" --repo "$REPO"

step "Create Deployment Status"
expect_exit_0 "deployment status-create succeeds" ghg deployment status-create "$DEPLOYMENT_ID" --state success --repo "$REPO" --description "ghg test deployment"

step "Set Deployment Inactive"
expect_exit_0 "deployment status-create inactive succeeds" ghg deployment status-create "$DEPLOYMENT_ID" --state inactive --repo "$REPO"
DEPLOYMENT_ID=""

step "List With Environment Filter"
expect_exit_0 "deployment list with environment filter" ghg deployment list --repo "$REPO" --environment production