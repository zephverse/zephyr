export interface HNStory {
  by: string;
  descendants: number;
  id: number;
  score: number;
  time: number;
  title: string;
  type: string;
  url?: string;
}

export interface FetchStoriesOptions {
  identifier?: string;
  limit: number;
  page: number;
  search?: string;
  sort?: string;
  type?: string;
}

export interface HNApiResponse {
  hasMore: boolean;
  stories: HNStory[];
  total: number;
}

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
