/** biome-ignore-all lint/a11y/noSvgWithoutTitle: not needed */
"use client";

import { useDebounce } from "@zephyr/ui/hooks/use-debounce";
import { cn } from "@zephyr/ui/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@zephyr/ui/shadui/avatar";
import { Button } from "@zephyr/ui/shadui/button";
import { ChevronDown, FileText, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import type { ModalAction, User, UserFilters } from "../types/types";

type UserTableProps = {
  users: User[];
  onAction: (user: User, action: ModalAction) => void;
  searchQuery: string;
  onSearchChangeAction: (query: string) => void;
  totalCount?: number;
  hasMore?: boolean;
  onLoadMoreAction?: () => void;
  filters?: UserFilters;
  onFiltersChangeAction?: (filters: UserFilters) => void;
  sortBy?: "createdAt" | "aura" | "username" | "displayName";
  sortOrder?: "asc" | "desc";
  onSortChangeAction?: (
    sortBy: "createdAt" | "aura" | "username" | "displayName",
    sortOrder: "asc" | "desc"
  ) => void;
};

export function UserTable({
  users,
  onAction,
  searchQuery,
  onSearchChangeAction,
  totalCount: _totalCount,
  hasMore: _hasMore,
  onLoadMoreAction: _onLoadMore,
  filters: _filters,
  onFiltersChangeAction: _onFiltersChange,
  sortBy: _sortBy,
  sortOrder: _sortOrder,
  onSortChangeAction: _onSortChange,
}: UserTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounce the search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Sync local search query with prop changes (e.g., when cleared externally)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Call search action when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      onSearchChangeAction(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, onSearchChangeAction, searchQuery]);

  const toggleRow = (userId: string) => {
    setExpandedRow(expandedRow === userId ? null : userId);
  };

  return (
    <div className="relative h-full">
      <div className="h-full overflow-hidden">
        <div className="custom-scrollbar h-full overflow-x-auto overflow-y-auto">
          <table aria-label="User management table" className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-border border-b bg-muted/50">
                <th className="w-24 px-2 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Aura
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Following
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Followers
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Joined
                </th>
                <th className="w-16 px-4 py-2 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.slice(0, entriesPerPage).map((user, index) => (
                <React.Fragment key={user.id}>
                  <motion.tr
                    animate={{ opacity: 1 }}
                    className="group transition-colors duration-150 hover:bg-accent/50"
                    initial={{ opacity: 0 }}
                    key={user.id}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <td className="w-24 px-2 py-2">
                      <span
                        className="block truncate font-mono text-muted-foreground text-xs"
                        title={user.id}
                      >
                        {user.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="font-medium text-foreground text-sm">
                        <span
                          className="block max-w-32 truncate"
                          title={user.displayName}
                        >
                          {user.displayName}
                        </span>
                        <span
                          className="block max-w-32 truncate font-normal text-muted-foreground text-xs"
                          title={`@${user.username}`}
                        >
                          @{user.username}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-muted-foreground text-sm">
                      <span
                        className="block max-w-48 truncate"
                        title={user.email || "No email"}
                      >
                        {user.email || "No email"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-primary text-sm">
                      {user.aura.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-muted-foreground text-sm">
                      {user.posts.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-muted-foreground text-sm">
                      {user.sessions}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-muted-foreground text-sm">
                      {user.following.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-muted-foreground text-sm">
                      {user.followers.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-muted-foreground text-sm">
                      {new Date(user.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center">
                      <Button
                        aria-expanded={expandedRow === user.id}
                        aria-label={`Toggle details for ${user.displayName}`}
                        className="h-7 w-7 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground"
                        onClick={() => toggleRow(user.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <motion.div
                          animate={{
                            rotate: expandedRow === user.id ? 180 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    </td>
                  </motion.tr>
                  <AnimatePresence>
                    {expandedRow === user.id && (
                      <motion.tr
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-muted/30"
                        exit={{ opacity: 0, height: 0 }}
                        initial={{ opacity: 0, height: 0 }}
                        key={`${user.id}-details`}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="px-4 py-4" colSpan={11}>
                          <div className="flex gap-6">
                            <Avatar className="h-24 w-24 border-2 border-border">
                              <AvatarImage
                                alt={user.displayName}
                                src={user.avatarUrl || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                                {user.displayName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className="font-semibold text-foreground text-lg">
                                  {user.displayName}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  @{user.username}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    ID:
                                  </span>{" "}
                                  <span className="font-mono text-foreground text-xs">
                                    {user.id}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Email:
                                  </span>{" "}
                                  <span className="text-foreground">
                                    {user.email}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Role:
                                  </span>{" "}
                                  <span className="text-foreground capitalize">
                                    {user.role}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Email Verified:
                                  </span>{" "}
                                  <span className="text-foreground">
                                    {user.emailVerified ? "Yes" : "No"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Member Since:
                                  </span>{" "}
                                  <span className="text-foreground">
                                    {user.joinedDate}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Total Posts:
                                  </span>{" "}
                                  <span className="text-foreground">
                                    {user.posts.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  className="border-border hover:bg-accent"
                                  onClick={() => onAction(user, "view")}
                                  size="sm"
                                  variant="outline"
                                >
                                  View Full Profile
                                </Button>
                                <Button
                                  className="border-border hover:bg-accent"
                                  onClick={() => onAction(user, "edit")}
                                  size="sm"
                                  variant="outline"
                                >
                                  Edit User
                                </Button>
                                <Button
                                  className="border-border hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => onAction(user, "update")}
                                  size="sm"
                                  variant="outline"
                                >
                                  Update
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-20"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {searchExpanded && (
              <motion.input
                animate={{ width: 280, opacity: 1 }}
                autoFocus
                className="h-10 rounded-full border border-border bg-card px-4 text-foreground text-sm shadow-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                exit={{ width: 0, opacity: 0 }}
                initial={{ width: 0, opacity: 0 }}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Search users..."
                transition={{ duration: 0.2 }}
                type="text"
                value={localSearchQuery}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!searchExpanded && (
              <>
                <motion.button
                  animate={{ scale: 1, opacity: 1 }}
                  aria-label="Open search"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-150 hover:bg-primary/90"
                  exit={{ scale: 0, opacity: 0 }}
                  initial={{ scale: 0, opacity: 0 }}
                  onClick={() => setSearchExpanded(true)}
                  transition={{ duration: 0.15 }}
                >
                  <Search className="h-5 w-5" />
                </motion.button>
                <motion.button
                  animate={{ scale: 1, opacity: 1 }}
                  aria-label="View logs"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all duration-150 hover:bg-accent"
                  exit={{ scale: 0, opacity: 0 }}
                  initial={{ scale: 0, opacity: 0 }}
                  onClick={() => console.log("[v0] Navigate to logs page")}
                  transition={{ duration: 0.15, delay: 0.05 }}
                >
                  <FileText className="h-5 w-5" />
                </motion.button>
              </>
            )}
          </AnimatePresence>
          {searchExpanded && (
            <button
              aria-label="Close search"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-all duration-150 hover:bg-destructive/90"
              onClick={() => {
                if (searchQuery) {
                  onSearchChangeAction("");
                }
                setSearchExpanded(false);
              }}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="fixed right-6 bottom-6 z-20"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
          <span className="text-muted-foreground text-xs">Show:</span>
          {[25, 50, 100].map((value) => (
            <button
              className={cn(
                "rounded-full px-3 py-1 font-medium text-xs transition-all duration-150",
                entriesPerPage === value
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              key={value}
              onClick={() => setEntriesPerPage(value)}
              type="button"
            >
              {value}
            </button>
          ))}
          <span className="text-muted-foreground text-xs">entries</span>
        </div>
      </motion.div>
    </div>
  );
}
