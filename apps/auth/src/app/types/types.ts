export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  authMethod: "email" | "google" | "github" | "discord" | "twitter";
  linkedAuth: ("email" | "google" | "github" | "discord" | "twitter")[];
  aura: number;
  posts: number;
  mentions: string[];
  sessions: number;
  following: number;
  followers: number;
  bookmarks: number;
  joinedDate: string;
};

export type ModalAction = "view" | "edit" | "suspend" | "activate" | "ban";
