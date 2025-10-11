export type User = {
  id: string;
  username: string;
  displayName: string;
  displayUsername: string | null;
  email: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
  bio: string | null;
  aura: number;
  role: "user" | "admin";
  posts: number;
  sessions: number;
  following: number;
  followers: number;
  bookmarks: number;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
};

export type UserFilters = {
  role?: "user" | "admin";
  emailVerified?: boolean;
  hasEmail?: boolean;
  search?: string;
};

export type UserListResult = {
  users: User[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
};

export type UserStats = {
  totalUsers: number;
  adminUsers: number;
  verifiedUsers: number;
  recentUsers: number;
  totalPosts: number;
  totalAura: number;
};

export type UserDetail = {
  id: string;
  username: string;
  displayName: string;
  displayUsername?: string;
  email?: string;
  emailVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  aura: number;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  accounts: Array<{
    providerId: string;
    createdAt: Date;
  }>;
  sessions: Array<{
    id: string;
    createdAt: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }>;
  _count: {
    posts: number;
    followers: number;
    following: number;
    bookmarks: number;
    comments: number;
    votes: number;
  };
};

export type ModalAction = "view" | "edit" | "update";
