export interface User {
  aura: number;
  avatarUrl: string | null;
  banned: boolean;
  bio: string | null;
  bookmarks: number;
  createdAt: string;
  displayName: string;
  displayUsername: string | null;
  email: string | null;
  emailVerified: boolean;
  followers: number;
  following: number;
  id: string;
  joinedDate: string;
  posts: number;
  role: "user" | "admin";
  sessions: number;
  updatedAt: string;
  username: string;
}

export interface UserFilters {
  emailVerified?: boolean;
  hasEmail?: boolean;
  role?: "user" | "admin";
  search?: string;
}

export interface UserListResult {
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  users: User[];
}

export interface UserStats {
  adminUsers: number;
  recentUsers: number;
  totalAura: number;
  totalPosts: number;
  totalUsers: number;
  verifiedUsers: number;
}

export interface UserDetail {
  _count: {
    posts: number;
    followers: number;
    following: number;
    bookmarks: number;
    comments: number;
    votes: number;
  };
  accounts: Array<{
    providerId: string;
    createdAt: Date;
  }>;
  aura: number;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
  displayName: string;
  displayUsername?: string;
  email?: string;
  emailVerified: boolean;
  id: string;
  role: "user" | "admin";
  sessions: Array<{
    id: string;
    createdAt: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }>;
  updatedAt: Date;
  username: string;
}

export type ModalAction = "view" | "edit" | "update";
