import client from "./client";

const OWNER_QUERY = `
  query ProjectOwner($owner: String!) {
    viewer { login }
    organization(login: $owner) { id login }
    user(login: $owner) { id login }
  }
`;

const PROJECTS_QUERY = `
  query Projects($owner: String!, $limit: Int!) {
    organization(login: $owner) {
      projectsV2(first: $limit, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes { id number title shortDescription closed url updatedAt }
      }
    }
    user(login: $owner) {
      projectsV2(first: $limit, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes { id number title shortDescription closed url updatedAt }
      }
    }
  }
`;

const PROJECT_QUERY = `
  query Project($owner: String!, $number: Int!, $limit: Int!) {
    organization(login: $owner) {
      projectV2(number: $number) {
        id number title shortDescription closed url updatedAt
        items(first: $limit) {
          nodes {
            id type
            content {
              ... on Issue { id number title url state repository { nameWithOwner } }
              ... on PullRequest { id number title url state repository { nameWithOwner } }
              ... on DraftIssue { id title body }
            }
            fieldValueByName(name: "Status") {
              ... on ProjectV2ItemFieldSingleSelectValue { name }
            }
          }
        }
        fields(first: 100) {
          nodes {
            ... on ProjectV2Field { id name dataType }
            ... on ProjectV2SingleSelectField { id name dataType options { id name } }
            ... on ProjectV2IterationField { id name dataType }
          }
        }
      }
    }
    user(login: $owner) {
      projectV2(number: $number) {
        id number title shortDescription closed url updatedAt
        items(first: $limit) {
          nodes {
            id type
            content {
              ... on Issue { id number title url state repository { nameWithOwner } }
              ... on PullRequest { id number title url state repository { nameWithOwner } }
              ... on DraftIssue { id title body }
            }
            fieldValueByName(name: "Status") {
              ... on ProjectV2ItemFieldSingleSelectValue { name }
            }
          }
        }
        fields(first: 100) {
          nodes {
            ... on ProjectV2Field { id name dataType }
            ... on ProjectV2SingleSelectField { id name dataType options { id name } }
            ... on ProjectV2IterationField { id name dataType }
          }
        }
      }
    }
  }
`;

const ISSUE_QUERY = `
  query ProjectIssue($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) { issue(number: $number) { id title } }
  }
`;

const REPOSITORY_QUERY = `
  query ProjectRepository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) { id nameWithOwner }
  }
`;

const mutation = (name: string, inputType: string, fields: string) => `
  mutation ${name}($input: ${inputType}!) {
    ${name}(input: $input) { ${fields} }
  }
`;

const projects = {
  board: (owner: string, number: number) =>
    client.graphqlTokenRequired(PROJECT_QUERY, { owner, number, limit: 100 }),
  owner: (owner: string) => client.graphqlTokenRequired(OWNER_QUERY, { owner }),
  list: (owner: string, limit: number) =>
    client.graphqlTokenRequired(PROJECTS_QUERY, { owner, limit }),
  get: (owner: string, number: number, limit = 100) =>
    client.graphqlTokenRequired(PROJECT_QUERY, { owner, number, limit }),
  issue: (repo: string, number: number) => {
    const [owner, name] = repo.split("/");
    return client.graphqlTokenRequired(ISSUE_QUERY, { owner, name, number });
  },
  repository: (repo: string) => {
    const [owner, name] = repo.split("/");
    return client.graphqlTokenRequired(REPOSITORY_QUERY, { owner, name });
  },
  create: (ownerId: string, title: string) =>
    client.graphqlTokenRequired(
      mutation(
        "createProjectV2",
        "CreateProjectV2Input",
        "projectV2 { id number title url }",
      ),
      { input: { ownerId, title } },
    ),
  update: (
    projectId: string,
    input: { title?: string; shortDescription?: string; closed?: boolean },
  ) =>
    client.graphqlTokenRequired(
      mutation(
        "updateProjectV2",
        "UpdateProjectV2Input",
        "projectV2 { id number title shortDescription closed url }",
      ),
      { input: { projectId, ...input } },
    ),
  delete: (projectId: string) =>
    client.graphqlTokenRequired(
      mutation("deleteProjectV2", "DeleteProjectV2Input", "clientMutationId"),
      { input: { projectId } },
    ),
  addItem: (projectId: string, contentId: string) =>
    client.graphqlTokenRequired(
      mutation(
        "addProjectV2ItemById",
        "AddProjectV2ItemByIdInput",
        "item { id }",
      ),
      { input: { projectId, contentId } },
    ),
  createItem: (projectId: string, title: string, body?: string) =>
    client.graphqlTokenRequired(
      mutation(
        "addProjectV2DraftIssue",
        "AddProjectV2DraftIssueInput",
        "projectItem { id }",
      ),
      { input: { projectId, title, body } },
    ),
  link: (projectId: string, repositoryId: string) =>
    client.graphqlTokenRequired(
      mutation(
        "linkProjectV2ToRepository",
        "LinkProjectV2ToRepositoryInput",
        "repository { id }",
      ),
      { input: { projectId, repositoryId } },
    ),
  unlink: (projectId: string, repositoryId: string) =>
    client.graphqlTokenRequired(
      mutation(
        "unlinkProjectV2FromRepository",
        "UnlinkProjectV2FromRepositoryInput",
        "repository { id }",
      ),
      { input: { projectId, repositoryId } },
    ),
};

export default projects;
