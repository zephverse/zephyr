"use client";

import { useState } from "react";
import { EmptyState } from "./components/empty-state";
import { LoadingState } from "./components/loading-state";
import UserManagement from "./components/user-management";
import { trpc } from "./trpc/client";
import type { ModalAction, User, UserFilters } from "./types/types";

export default function AdminDashboardClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>({
    role: undefined,
    emailVerified: undefined,
    hasEmail: undefined,
  });
  const [sortBy, setSortBy] = useState<
    "createdAt" | "aura" | "username" | "displayName"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cursor, setCursor] = useState<string | undefined>();

  const {
    data: userList,
    isLoading,
    refetch,
  } = trpc.admin.getUsers.useQuery<{
    users: User[];
    totalCount: number;
    hasMore: boolean;
    nextCursor?: string;
  }>({
    limit: 20,
    cursor,
    filters: {
      ...filters,
      search: searchQuery || undefined,
    },
    sortBy,
    sortOrder,
  });

  const handleAction = (_user: User, _action: ModalAction) => {
    refetch();
  };

  const handleLoadMore = () => {
    if (userList?.hasMore && userList.nextCursor) {
      setCursor(userList.nextCursor);
    }
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    setCursor(undefined);
  };

  const handleSortChange = (
    newSortBy: typeof sortBy,
    newSortOrder: typeof sortOrder
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCursor(undefined);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCursor(undefined);
  };

  if (isLoading && !userList) {
    return <LoadingState />;
  }

  if (!(isLoading || userList)) {
    return <EmptyState description="Failed to load users." title="Error" />;
  }

  if (!userList || userList.users.length === 0) {
    return (
      <EmptyState
        description="Users will appear here once they register on the platform."
        title="No users found"
      />
    );
  }

  return (
    <UserManagement
      filters={filters}
      hasMore={userList.hasMore}
      onAction={handleAction}
      onFiltersChangeAction={handleFiltersChange}
      onLoadMoreAction={handleLoadMore}
      onSearchChangeAction={handleSearchChange}
      onSortChangeAction={handleSortChange}
      searchQuery={searchQuery}
      sortBy={sortBy}
      sortOrder={sortOrder}
      totalCount={userList.totalCount}
      users={userList.users}
    />
  );
}
