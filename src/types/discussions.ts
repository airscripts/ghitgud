interface Discussion {
  id: string;
  url: string;
  body: string;
  title: string;
  state: string;
  number: number;
  author: string;
  pinned: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
}

interface DiscussionCategory {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
}

interface DiscussionComment {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

interface DiscussionCreateInput {
  title: string;
  body?: string;
  categoryId: string;
  repositoryId: string;
}

interface DiscussionCommentInput {
  body: string;
  discussionId: string;
}

export type {
  Discussion,
  DiscussionComment,
  DiscussionCategory,
  DiscussionCreateInput,
  DiscussionCommentInput,
};
