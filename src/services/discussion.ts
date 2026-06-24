import client from "@/api/client";
import output from "@/core/output";
import logger from "@/core/logger";
import api from "@/api/discussions";
import { GhitgudError } from "@/core/errors";
import { Discussion, DiscussionCategory, DiscussionComment } from "@/types";

interface ListOptions {
  limit?: number;
  category?: string;
}

interface GraphQlErrorResponse {
  errors?: Array<{ message: string }>;
}

interface DiscussionNode {
  id: string;
  url: string;
  title: string;
  closed: boolean;
  number: number;
  createdAt: string;
  updatedAt: string;
  comments?: { totalCount: number };
  author?: { login?: string } | null;
  category?: { name?: string } | null;
}

interface CommentNode {
  id: string;
  body: string;
  createdAt: string;
  author?: { login?: string } | null;
}

interface ListResponse extends GraphQlErrorResponse {
  data?: {
    repository?: {
      discussions?: {
        nodes?: DiscussionNode[];
      } | null;
    } | null;
  };
}

interface GetResponse extends GraphQlErrorResponse {
  data?: {
    repository?: {
      discussion?: {
        id: string;
        url: string;
        body: string;
        title: string;
        closed: boolean;
        number: number;
        createdAt: string;
        updatedAt: string;
        author?: { login?: string } | null;
        category?: { name?: string } | null;

        comments?: {
          totalCount: number;
          nodes?: CommentNode[];
        };
      } | null;
    } | null;
  };
}

interface CategoriesResponse extends GraphQlErrorResponse {
  data?: {
    repository?: {
      discussionCategories?: {
        nodes?: Array<{
          id: string;
          name: string;
          emoji: string | null;
          description: string | null;
        }>;
      } | null;
    } | null;
  };
}

interface CreateResponse extends GraphQlErrorResponse {
  data?: {
    createDiscussion?: {
      discussion?: {
        id: string;
        url: string;
        title: string;
        number: number;
      } | null;
    } | null;
  };
}

interface CommentResponse extends GraphQlErrorResponse {
  data?: {
    addDiscussionComment?: {
      comment?: {
        id: string;
        body: string;
        createdAt: string;
      } | null;
    } | null;
  };
}

interface CloseResponse extends GraphQlErrorResponse {
  data?: {
    closeDiscussion?: {
      discussion?: {
        id: string;
        closed: boolean;
        number: number;
      } | null;
    } | null;
  };
}

function getRepoParts(repo: string): {
  owner: string;
  name: string;
} {
  const parts = api.parseRepo(repo);
  return parts;
}

function handleGraphQlErrors(payload: GraphQlErrorResponse): void {
  if (payload.errors?.length) {
    throw new GhitgudError(payload.errors[0].message);
  }
}

function toDiscussion(node: DiscussionNode): Discussion {
  return {
    id: node.id,
    url: node.url,
    body: "",
    title: node.title,
    closed: node.closed,
    number: node.number,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    category: node.category?.name ?? "-",
    author: node.author?.login ?? "unknown",
    commentsCount: node.comments?.totalCount ?? 0,
  };
}

async function fetchDiscussion(
  owner: string,
  name: string,
  number: number,
): Promise<{
  discussion: Discussion;
  comments: DiscussionComment[];
}> {
  const response = await api.get(owner, name, number);
  const payload = (await response.json()) as GetResponse;
  handleGraphQlErrors(payload);

  const raw = payload.data?.repository?.discussion;
  if (!raw) {
    throw new GhitgudError(`Discussion #${number} not found.`);
  }

  const discussion: Discussion = {
    id: raw.id,
    url: raw.url,
    body: raw.body,
    title: raw.title,
    closed: raw.closed,
    number: raw.number,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    category: raw.category?.name ?? "-",
    author: raw.author?.login ?? "unknown",
    commentsCount: raw.comments?.totalCount ?? 0,
  };

  const comments: DiscussionComment[] =
    raw.comments?.nodes?.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: c.author?.login ?? "unknown",
    })) ?? [];

  return { discussion, comments };
}

async function resolveCategoryId(
  owner: string,
  name: string,
  categoryName: string,
): Promise<string> {
  const response = await api.categories(owner, name);
  const payload = (await response.json()) as CategoriesResponse;
  handleGraphQlErrors(payload);

  const categories =
    payload.data?.repository?.discussionCategories?.nodes ?? [];

  const match = categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  );

  if (!match) {
    const available = categories.map((c) => c.name).join(", ");
    throw new GhitgudError(
      `Category "${categoryName}" not found. Available: ${available}`,
    );
  }

  return match.id;
}

const list = async (repo: string, options: ListOptions = {}) => {
  const { owner, name } = getRepoParts(repo);
  let categoryId: string | undefined;

  if (options.category) {
    logger.start(`Resolving category "${options.category}".`);
    categoryId = await resolveCategoryId(owner, name, options.category);
  }

  logger.start(`Loading discussions for ${owner}/${name}.`);
  const response = await api.list(owner, name, categoryId, options.limit ?? 30);

  const payload = (await response.json()) as ListResponse;
  handleGraphQlErrors(payload);

  const nodes = payload.data?.repository?.discussions?.nodes ?? [];
  const discussions = nodes.map(toDiscussion);

  output.renderTable(
    discussions.map((d) => ({
      url: d.url,
      title: d.title,
      category: d.category,
      number: `#${d.number}`,
      comments: d.commentsCount,
      state: d.closed ? "closed" : "open",
    })),

    { emptyMessage: "No discussions found." },
  );

  return { success: true, discussions };
};

const view = async (repo: string, number: number) => {
  if (!Number.isInteger(number) || number <= 0) {
    throw new GhitgudError(`Invalid discussion number: ${number}`);
  }

  const { owner, name } = getRepoParts(repo);
  logger.start(`Loading discussion #${number}.`);
  const { discussion, comments } = await fetchDiscussion(owner, name, number);

  output.renderSummary("Discussion", [
    ["Number", `#${discussion.number}`],
    ["Title", discussion.title],
    ["Author", discussion.author],
    ["Category", discussion.category],
    ["State", discussion.closed ? "closed" : "open"],
    ["Comments", discussion.commentsCount],
    ["URL", discussion.url],
  ]);

  if (discussion.body) {
    output.log("");
    output.log(discussion.body);
  }

  if (comments.length) {
    output.renderSection("Comments");

    for (const comment of comments) {
      output.log(`@${comment.author} — ${comment.createdAt}`);
      output.log(comment.body);
      output.log("");
    }
  }

  return { success: true, discussion, comments };
};

const categories = async (repo: string) => {
  const { owner, name } = getRepoParts(repo);
  logger.start(`Loading discussion categories for ${owner}/${name}.`);

  const response = await api.categories(owner, name);
  const payload = (await response.json()) as CategoriesResponse;
  handleGraphQlErrors(payload);

  const nodes = payload.data?.repository?.discussionCategories?.nodes ?? [];
  const items: DiscussionCategory[] = nodes.map((n) => ({
    id: n.id,
    name: n.name,
    emoji: n.emoji,
    description: n.description,
  }));

  output.renderTable(
    items.map((c) => ({
      name: c.name,
      emoji: c.emoji ?? "-",
      description: c.description ?? "-",
    })),
    { emptyMessage: "No categories found." },
  );

  return { success: true, categories: items };
};

const create = async (
  repo: string,
  options: {
    title: string;
    body?: string;
    category: string;
  },
) => {
  if (!options.title) {
    throw new GhitgudError("--title is required.");
  }

  if (!options.category) {
    throw new GhitgudError("--category is required.");
  }

  const { owner, name } = api.parseRepo(repo);

  logger.start(`Resolving category "${options.category}".`);
  const categoryId = await resolveCategoryId(owner, name, options.category);

  logger.start(`Creating discussion in ${repo}.`);

  const repoIdResponse = await client.graphqlTokenRequired(
    `query RepoId($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) { id }
    }`,
    { owner, name },
  );

  const repoIdPayload = (await repoIdResponse.json()) as {
    errors?: Array<{ message: string }>;
    data?: { repository?: { id: string } | null } | null;
  };

  handleGraphQlErrors(repoIdPayload);
  const repositoryId = repoIdPayload.data?.repository?.id;

  if (!repositoryId) {
    throw new GhitgudError(`Could not resolve repository id for ${repo}.`);
  }

  const response = await api.create(
    repositoryId,
    categoryId,
    options.title,
    options.body,
  );

  const payload = (await response.json()) as CreateResponse;
  handleGraphQlErrors(payload);

  const discussion = payload.data?.createDiscussion?.discussion;
  if (!discussion) {
    throw new GhitgudError("Discussion creation failed.");
  }

  logger.success(`Created discussion #${discussion.number}.`);
  output.renderSummary("Created Discussion", [
    ["Number", `#${discussion.number}`],
    ["Title", discussion.title],
    ["URL", discussion.url],
  ]);

  return {
    success: true,
    discussion: {
      id: discussion.id,
      url: discussion.url,
      title: discussion.title,
      number: discussion.number,
    },
  };
};

const comment = async (repo: string, numberValue: string, body: string) => {
  if (!body) {
    throw new GhitgudError("--body is required.");
  }

  const number = Number(numberValue);
  if (!Number.isInteger(number) || number <= 0) {
    throw new GhitgudError(`Invalid discussion number: ${numberValue}`);
  }

  const { owner, name } = getRepoParts(repo);
  logger.start(`Adding comment to discussion #${number}.`);
  const { discussion } = await fetchDiscussion(owner, name, number);

  const response = await api.comment(discussion.id, body);
  const payload = (await response.json()) as CommentResponse;
  handleGraphQlErrors(payload);

  const commentData = payload.data?.addDiscussionComment?.comment;
  if (!commentData) {
    throw new GhitgudError("Comment creation failed.");
  }

  logger.success(`Comment added to discussion #${number}.`);

  return {
    success: true,

    comment: {
      id: commentData.id,
      body: commentData.body,
      createdAt: commentData.createdAt,
    },
  };
};

const close = async (repo: string, numberValue: string) => {
  const number = Number(numberValue);
  if (!Number.isInteger(number) || number <= 0) {
    throw new GhitgudError(`Invalid discussion number: ${numberValue}`);
  }

  const { owner, name } = getRepoParts(repo);
  logger.start(`Closing discussion #${number}.`);

  const { discussion } = await fetchDiscussion(owner, name, number);
  const response = await api.close(discussion.id);
  const payload = (await response.json()) as CloseResponse;
  handleGraphQlErrors(payload);

  const result = payload.data?.closeDiscussion?.discussion;
  if (!result) {
    throw new GhitgudError("Close discussion failed.");
  }

  logger.success(`Closed discussion #${result.number}.`);
  return {
    success: true,
    number: result.number,
    closed: result.closed,
  };
};

export default {
  list,
  view,
  close,
  create,
  comment,
  categories,
};
