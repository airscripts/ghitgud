import client from "./client";

interface SearchResponse {
  total_count: number;
}

interface IssueCreateOptions {
  title: string;
  body?: string;
  type?: string;
  labels?: string[];
  assignees?: string[];
}

interface IssueListOptions {
  limit?: number;
  labels?: string[];
  assignees?: string[];
  state?: "open" | "closed" | "all";
}

const DELETE_ISSUE_MUTATION = `
  mutation DeleteIssue($issueId: ID!) {
    deleteIssue(input: { issueId: $issueId }) { clientMutationId }
  }
`;

const PIN_ISSUE_MUTATION = `
  mutation PinIssue($issueId: ID!) {
    pinIssue(input: { issueId: $issueId }) { issue { id number } }
  }
`;

const UNPIN_ISSUE_MUTATION = `
  mutation UnpinIssue($issueId: ID!) {
    unpinIssue(input: { issueId: $issueId }) { issue { id number } }
  }
`;

const TRANSFER_ISSUE_MUTATION = `
  mutation TransferIssue($issueId: ID!, $repositoryId: ID!) {
    transferIssue(input: {
      issueId: $issueId
      repositoryId: $repositoryId
      createLabelsIfMissing: false
    }) {
      issue { id number title url }
    }
  }
`;

const ISSUE_PIN_STATE_QUERY = `
  query IssuePinState($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $number) { isPinned }
    }
  }
`;

function buildQuery(repo: string, qualifiers: string[]): string {
  return encodeURIComponent([`repo:${repo}`, ...qualifiers].join(" "));
}

function issueSearchEndpoint(qualifiers: string[], limit: number): string {
  const query = encodeURIComponent(["is:issue", ...qualifiers].join(" "));
  return `/search/issues?q=${query}&sort=updated&order=desc&per_page=${limit}`;
}

async function getCount(repo: string, qualifiers: string[]): Promise<number> {
  const response = await client.get(
    `/search/issues?q=${buildQuery(repo, qualifiers)}&per_page=1`,
  );
  const data = (await response.json()) as SearchResponse;
  return data.total_count;
}

const issues = {
  get: (issueNumber: number, repo: string): Promise<Response> =>
    client.getTokenRequired(`/repos/${repo}/issues/${issueNumber}`),

  create: (options: IssueCreateOptions, repo: string): Promise<Response> =>
    client.postTokenRequired(`/repos/${repo}/issues`, {
      title: options.title,
      ...(options.body !== undefined ? { body: options.body } : {}),
      ...(options.labels?.length ? { labels: options.labels } : {}),
      ...(options.assignees?.length ? { assignees: options.assignees } : {}),
      ...(options.type ? { type: options.type } : {}),
    }),

  list: (repo: string, options: IssueListOptions = {}): Promise<Response> => {
    const qualifiers = [
      `repo:${repo}`,
      ...(options.state === "all" ? [] : [`state:${options.state ?? "open"}`]),
      ...(options.labels ?? []).map(
        (label) => `label:${JSON.stringify(label)}`,
      ),

      ...(options.assignees ?? []).map(
        (assignee) => `assignee:${JSON.stringify(assignee)}`,
      ),
    ];
    return client.getTokenRequired(
      issueSearchEndpoint(qualifiers, options.limit ?? 10),
    );
  },

  status: (
    qualifier: "assignee:@me" | "author:@me" | "mentions:@me",
    repo?: string,
    limit = 10,
  ): Promise<Response> =>
    client.getTokenRequired(
      issueSearchEndpoint(
        ["state:open", qualifier, ...(repo ? [`repo:${repo}`] : [])],
        limit,
      ),
    ),

  update: (
    issueNumber: number,
    options: { title?: string; body?: string; state?: "open" | "closed" },
    repo: string,
  ): Promise<Response> =>
    client.patchTokenRequired(`/repos/${repo}/issues/${issueNumber}`, options),

  comment: (issueNumber: number, body: string, repo: string) =>
    client.postTokenRequired(`/repos/${repo}/issues/${issueNumber}/comments`, {
      body,
    }),

  lock: (issueNumber: number, repo: string) =>
    client.putTokenRequired(`/repos/${repo}/issues/${issueNumber}/lock`, {}),

  unlock: (issueNumber: number, repo: string) =>
    client.deleteTokenRequired(`/repos/${repo}/issues/${issueNumber}/lock`),

  issueTypes: (repo: string) =>
    client.getTokenRequired(`/repos/${repo}/issue-types`),

  repository: (repo: string) => client.getTokenRequired(`/repos/${repo}`),

  pinState: (issueNumber: number, repo: string) => {
    const [owner, name] = repo.split("/");

    return client.graphqlTokenRequired(ISSUE_PIN_STATE_QUERY, {
      owner,
      name,
      number: issueNumber,
    });
  },

  delete: (issueId: string) =>
    client.graphqlTokenRequired(DELETE_ISSUE_MUTATION, { issueId }),

  pin: (issueId: string) =>
    client.graphqlTokenRequired(PIN_ISSUE_MUTATION, { issueId }),

  unpin: (issueId: string) =>
    client.graphqlTokenRequired(UNPIN_ISSUE_MUTATION, { issueId }),

  transfer: (issueId: string, repositoryId: string) =>
    client.graphqlTokenRequired(TRANSFER_ISSUE_MUTATION, {
      issueId,
      repositoryId,
    }),

  listSubIssues: (issueNumber: number, repo: string): Promise<Response> =>
    client.getTokenRequired(`/repos/${repo}/issues/${issueNumber}/sub_issues`),

  addSubIssue: (issueNumber: number, subIssueNumber: number, repo: string) =>
    client.postTokenRequired(
      `/repos/${repo}/issues/${issueNumber}/sub_issues`,
      {
        sub_issue_id: subIssueNumber,
      },
    ),

  countOpen: (repo: string): Promise<number> =>
    getCount(repo, ["type:issue", "state:open"]),

  countStale: (repo: string, olderThan: string): Promise<number> =>
    getCount(repo, ["type:issue", "state:open", `updated:<${olderThan}`]),
};

export default issues;
