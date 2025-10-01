export type HNStory = {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
  type: string;
};

export type FetchStoriesOptions = {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  type?: string;
  identifier?: string;
};

export type HNApiResponse = {
  stories: HNStory[];
  hasMore: boolean;
  total: number;
};

export class HackerNewsError extends Error {
  statusCode = 500;
  context?: unknown;

  constructor(message: string, statusCode = 500, context?: unknown) {
    super(message);
    this.name = "HackerNewsError";
    this.statusCode = statusCode;
    this.context = context;
  }
}
