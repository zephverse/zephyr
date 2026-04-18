export interface HNStoryType {
  by: string;
  descendants: number;
  id: number;
  score: number;
  time: number;
  title: string;
  url?: string;
}

export interface HNApiResponse {
  hasMore: boolean;
  stories: HNStoryType[];
  total: number;
}
