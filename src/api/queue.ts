import client from "./client";

const QUEUE_QUERY = `
  query MergeQueue($owner: String!, $name: String!, $branch: String!, $limit: Int!) {
    repository(owner: $owner, name: $name) {
      mergeQueue(branch: $branch) {
        id url nextEntryEstimatedTimeToMerge
        configuration {
          checkResponseTimeout maximumEntriesToBuild maximumEntriesToMerge
          mergeMethod mergingStrategy minimumEntriesToMerge minimumEntriesToMergeWaitTime
        }
        entries(first: $limit) {
          totalCount
          nodes {
            id position state jump solo enqueuedAt estimatedTimeToMerge
            enqueuer { login }
            headCommit { oid }
            pullRequest { id number title url headRefName baseRefName }
          }
        }
      }
    }
  }
`;

const PR_QUERY = `
  query QueuePullRequest($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        id number title headRefOid
        mergeQueueEntry { id position state }
      }
    }
  }
`;

const HISTORY_QUERY = `
  query MergeQueueHistory($owner: String!, $name: String!, $branch: String!, $limit: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: $limit, states: [OPEN, CLOSED, MERGED], baseRefName: $branch, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          number title url
          timelineItems(last: 20, itemTypes: [ADDED_TO_MERGE_QUEUE_EVENT, REMOVED_FROM_MERGE_QUEUE_EVENT]) {
            nodes {
              __typename
              ... on AddedToMergeQueueEvent { id createdAt actor { login } }
              ... on RemovedFromMergeQueueEvent { id createdAt actor { login } reason }
            }
          }
        }
      }
    }
  }
`;

const ENQUEUE_MUTATION = `
  mutation EnqueuePullRequest($input: EnqueuePullRequestInput!) {
    enqueuePullRequest(input: $input) {
      mergeQueueEntry { id position state enqueuedAt }
    }
  }
`;

const DEQUEUE_MUTATION = `
  mutation DequeuePullRequest($input: DequeuePullRequestInput!) {
    dequeuePullRequest(input: $input) {
      mergeQueueEntry { id position state }
    }
  }
`;

const variables = (repo: string) => {
  const [owner, name] = repo.split("/");
  return { owner, name };
};

const queue = {
  get: (repo: string, branch: string, limit = 100) =>
    client.graphqlTokenRequired(QUEUE_QUERY, {
      ...variables(repo),
      branch,
      limit,
    }),
  pullRequest: (repo: string, number: number) =>
    client.graphqlTokenRequired(PR_QUERY, { ...variables(repo), number }),
  history: (repo: string, branch: string, limit: number) =>
    client.graphqlTokenRequired(HISTORY_QUERY, {
      ...variables(repo),
      branch,
      limit,
    }),
  enqueue: (pullRequestId: string, expectedHeadOid: string) =>
    client.graphqlTokenRequired(ENQUEUE_MUTATION, {
      input: { pullRequestId, expectedHeadOid },
    }),
  dequeue: (pullRequestId: string) =>
    client.graphqlTokenRequired(DEQUEUE_MUTATION, {
      input: { id: pullRequestId },
    }),
};

export default queue;
