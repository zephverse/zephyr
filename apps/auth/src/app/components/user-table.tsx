/** biome-ignore-all lint/a11y/noSvgWithoutTitle: not needed */
"use client";

import { cn } from "@zephyr/ui/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@zephyr/ui/shadui/avatar";
import { Button } from "@zephyr/ui/shadui/button";
import { ChevronDown, FileText, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import type { ModalAction, User } from "../types/types";
import { SearchBar } from "./search-bar";

type UserTableProps = {
  users: User[];
  onAction: (user: User, action: ModalAction) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

function OAuthIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  const icons = {
    google: (
      <svg className={className} viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="currentColor"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="currentColor"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="currentColor"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="currentColor"
        />
      </svg>
    ),
    github: (
      <svg className={className} viewBox="0 0 24 24">
        <path
          d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"
          fill="currentColor"
        />
      </svg>
    ),
    discord: (
      <svg className={className} viewBox="0 0 24 24">
        <path
          d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.077.077 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418Z"
          fill="currentColor"
        />
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26l8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="currentColor"
        />
      </svg>
    ),
  };
  return icons[provider as keyof typeof icons] || null;
}

function AuthMethodCell({ user }: { user: User }) {
  const authProviders = ["email", "google", "github", "discord", "twitter"];

  return (
    <div className="flex items-center gap-2">
      {authProviders.map((provider) => {
        // biome-ignore lint/suspicious/noExplicitAny: TODO
        const isLinked = user.linkedAuth.includes(provider as any);
        const isPrimary = user.authMethod === provider;

        const getTitle = () => {
          if (isPrimary) {
            return `Primary: ${provider}`;
          }
          if (isLinked) {
            return `Linked: ${provider}`;
          }
          return `Not linked: ${provider}`;
        };

        return (
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded transition-colors",
              isLinked ? "text-foreground" : "text-muted-foreground/30"
            )}
            key={provider}
            title={getTitle()}
          >
            {provider === "email" ? (
              <Mail className="h-4 w-4" />
            ) : (
              <OAuthIcon className="h-4 w-4" provider={provider} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MentionsCell({ mentions }: { mentions: string[] }) {
  if (mentions.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
        {mentions.slice(0, 2).map((username, index) => (
          <React.Fragment key={username}>
            <button
              className="shrink-0 text-primary text-sm transition-colors hover:text-primary/80 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                console.log(`[v0] Clicked mention: @${username}`);
              }}
              type="button"
            >
              @{username}
            </button>
            {index < Math.min(mentions.length, 2) - 1 && (
              <span className="shrink-0 text-muted-foreground">,</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {mentions.length > 2 && (
        <span className="ml-1 shrink-0 text-muted-foreground text-sm">
          +{mentions.length - 2}
        </span>
      )}
    </div>
  );
}

export function UserTable({
  users,
  onAction,
  searchQuery,
  onSearchChange,
}: UserTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(25);

  const toggleRow = (userId: string) => {
    setExpandedRow(expandedRow === userId ? null : userId);
  };

  return (
    <div className="relative h-full">
      <div className="h-full overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-auto">
          <table aria-label="User management table" className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-border border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Auth Method
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
                <th className="px-4 py-2 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Bookmarks
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Mentions
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
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="font-mono text-muted-foreground text-xs">
                        {user.id}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="font-medium text-foreground text-sm">
                        {user.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          (@{user.username})
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <AuthMethodCell user={user} />
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
                    <td className="whitespace-nowrap px-4 py-2 text-right text-muted-foreground text-sm">
                      {user.bookmarks.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-muted-foreground text-sm">
                      {user.joinedDate}
                    </td>
                    <td className="px-4 py-2">
                      <MentionsCell mentions={user.mentions} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center">
                      <Button
                        aria-expanded={expandedRow === user.id}
                        aria-label={`Toggle details for ${user.name}`}
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
                        <td className="px-4 py-4" colSpan={12}>
                          <div className="flex gap-6">
                            <Avatar className="h-24 w-24 border-2 border-border">
                              <AvatarImage
                                alt={user.name}
                                src={user.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className="font-semibold text-foreground text-lg">
                                  {user.name}
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
                                    Primary Auth:
                                  </span>{" "}
                                  <span className="text-foreground capitalize">
                                    {user.authMethod}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Linked Accounts:
                                  </span>{" "}
                                  <span className="text-foreground">
                                    {user.linkedAuth
                                      .map(
                                        (auth) =>
                                          auth.charAt(0).toUpperCase() +
                                          auth.slice(1)
                                      )
                                      .join(", ")}
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
                                <div>
                                  <span className="text-muted-foreground">
                                    Mentioned By:
                                  </span>{" "}
                                  <span className="text-foreground">
                                    {user.mentions.length > 0
                                      ? user.mentions
                                          .map((u) => `@${u}`)
                                          .join(", ")
                                      : "None"}
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
                                  onClick={() => onAction(user, "suspend")}
                                  size="sm"
                                  variant="outline"
                                >
                                  Suspend
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
          <SearchBar onChange={onSearchChange} value={searchQuery} />
          <motion.button
            animate={{ scale: 1, opacity: 1 }}
            aria-label="View logs"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all duration-150 hover:bg-accent"
            initial={{ scale: 0, opacity: 0 }}
            onClick={() => console.log("[v0] Navigate to logs page")}
            transition={{ duration: 0.15, delay: 0.05 }}
          >
            <FileText className="h-5 w-5" />
          </motion.button>
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
