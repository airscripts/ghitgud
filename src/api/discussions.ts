import client from "./client";

const LIST_DISCUSSIONS_QUERY = `
  query ListDiscussions($owner: String!, $name: String!, $first: Int!, $categoryId: ID) {
    repository(owner: $owner, name: $name) {
      discussions(first: $first, filterBy: { categoryId: $categoryId }) {
        nodes {
          id
          number
          title
          author {
            login
          }
          category {
            name
          }
          state
          pinned
          createdAt
          updatedAt
          comments {
            totalCount
          }
          url
        }
      }
    }
  }
`;

const GET_DISCUSSION_QUERY = `
  query GetDiscussion($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      discussion(number: $number) {
        id
        number
        title
        body
        author {
          login
        }
        category {
          name
        }
        state
        pinned
        createdAt
        updatedAt
        comments(first: 100) {
          totalCount
          nodes {
            id
            body
            author {
              login
            }
            createdAt
          }
        }
        url
      }
    }
  }
`;

const LIST_CATEGORIES_QUERY = `
  query ListCategories($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      discussionCategories(first: 100) {
        nodes {
          id
          name
          description
          emoji
        }
      }
    }
  }
`;

const CREATE_DISCUSSION_MUTATION = `
  mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        number
        title
        url
      }
    }
  }
`;

const ADD_COMMENT_MUTATION = `
  mutation AddDiscussionComment($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
      comment {
        id
        body
        createdAt
      }
    }
  }
`;

const CLOSE_DISCUSSION_MUTATION = `
  mutation CloseDiscussion($discussionId: ID!) {
    closeDiscussion(input: { discussionId: $discussionId }) {
      discussion {
        id
        number
        state
      }
    }
  }
`;

const PIN_DISCUSSION_MUTATION = `
  mutation PinDiscussion($discussionId: ID!) {
    pinDiscussion(input: { discussionId: $discussionId }) {
      discussion {
        id
        number
        pinned
      }
    }
  }
`;

const UNPIN_DISCUSSION_MUTATION = `
  mutation UnpinDiscussion($discussionId: ID!) {
    unpinDiscussion(input: { discussionId: $discussionId }) {
      discussion {
        id
        number
        pinned
      }
    }
  }
`;

function parseRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid repo format: ${repo}`);
  }
  return { owner, name };
}

const discussions = {
  list: async (
    owner: string,
    name: string,
    categoryId?: string,
    limit = 30,
  ): Promise<Response> => {
    return client.graphqlTokenRequired(LIST_DISCUSSIONS_QUERY, {
      owner,
      name,
      first: Math.min(limit, 100),
      categoryId: categoryId ?? null,
    });
  },

  get: async (
    owner: string,
    name: string,
    number: number,
  ): Promise<Response> => {
    return client.graphqlTokenRequired(GET_DISCUSSION_QUERY, {
      owner,
      name,
      number,
    });
  },

  categories: async (owner: string, name: string): Promise<Response> => {
    return client.graphqlTokenRequired(LIST_CATEGORIES_QUERY, {
      owner,
      name,
    });
  },

  create: async (
    repositoryId: string,
    categoryId: string,
    title: string,
    body?: string,
  ): Promise<Response> => {
    return client.graphqlTokenRequired(CREATE_DISCUSSION_MUTATION, {
      title,
      categoryId,
      repositoryId,
      body: body ?? null,
    });
  },

  comment: async (discussionId: string, body: string): Promise<Response> => {
    return client.graphqlTokenRequired(ADD_COMMENT_MUTATION, {
      body,
      discussionId,
    });
  },

  close: async (discussionId: string): Promise<Response> => {
    return client.graphqlTokenRequired(CLOSE_DISCUSSION_MUTATION, {
      discussionId,
    });
  },

  pin: async (discussionId: string): Promise<Response> => {
    return client.graphqlTokenRequired(PIN_DISCUSSION_MUTATION, {
      discussionId,
    });
  },

  unpin: async (discussionId: string): Promise<Response> => {
    return client.graphqlTokenRequired(UNPIN_DISCUSSION_MUTATION, {
      discussionId,
    });
  },

  parseRepo,
};

export default discussions;
