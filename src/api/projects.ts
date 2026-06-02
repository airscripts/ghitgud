import client from "./client";

const PROJECT_BOARD_QUERY = `
  query ProjectBoard($owner: String!, $number: Int!) {
    organization(login: $owner) {
      projectV2(number: $number) {
        title
        items(first: 100) {
          nodes {
            content {
              ... on Issue {
                __typename
                number
                title
                url
                state
              }
              ... on PullRequest {
                __typename
                number
                title
                url
                state
              }
              ... on DraftIssue {
                __typename
                title
              }
            }
            fieldValueByName(name: "Status") {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
              }
            }
          }
        }
      }
    }
    user(login: $owner) {
      projectV2(number: $number) {
        title
        items(first: 100) {
          nodes {
            content {
              ... on Issue {
                __typename
                number
                title
                url
                state
              }
              ... on PullRequest {
                __typename
                number
                title
                url
                state
              }
              ... on DraftIssue {
                __typename
                title
              }
            }
            fieldValueByName(name: "Status") {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
              }
            }
          }
        }
      }
    }
  }
`;

const projects = {
  board: async (owner: string, number: number): Promise<Response> => {
    return client.graphqlTokenRequired(PROJECT_BOARD_QUERY, {
      owner,
      number,
    });
  },
};

export default projects;
