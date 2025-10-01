"use client";
import { useQueryClient } from "@tanstack/react-query";
import type { UserData } from "@zephyr/db";
import { Card, CardContent, CardTitle } from "@zephyr/ui/shadui/card";
import { ScrollArea } from "@zephyr/ui/shadui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";
import type React from "react";
import { useState } from "react";
import FriendsSkeleton from "@/components/Layouts/skeletons/FriendsSkeleton";
import UnfollowUserDialog from "@/components/Layouts/UnfollowUserDialog";
import { useFollowedUsers } from "@/hooks/user-follower-info";
import { useUnfollowUserMutation } from "@/hooks/user-mutations";
import { FriendListItem } from "./friend-list-item";
import { getRandomTitle } from "./random-titles";
import { ViewSwitcher } from "./view-switcher";

type FriendsProps = {
  isCollapsed: boolean;
};

type FriendsListProps = {
  followedUsers: UserData[];
  viewType: "grid" | "list";
  onUnfollow: (user: UserData) => void;
};

const FriendsList: React.FC<FriendsListProps> = ({
  followedUsers,
  viewType,
  onUnfollow,
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      className={`grid gap-3 ${
        viewType === "grid" ? "grid-cols-2" : "grid-cols-1"
      }`}
      layout
    >
      {followedUsers?.map((user) => (
        <FriendListItem
          key={user.id}
          onUnfollow={onUnfollow}
          user={user}
          viewType={viewType}
        />
      ))}
    </motion.div>
  </AnimatePresence>
);

const Friends: React.FC<FriendsProps> = ({ isCollapsed }) => {
  const { data: followedUsers, isLoading } = useFollowedUsers();
  const [title, _setTitle] = useState(getRandomTitle());
  const queryClient = useQueryClient();
  const unfollowMutation = useUnfollowUserMutation();
  const [userToUnfollow, setUserToUnfollow] = useState<UserData | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list">("list");

  const handleUnfollow = (user: UserData) => setUserToUnfollow(user);
  const handleCloseDialog = () => setUserToUnfollow(null);

  const performUnfollow = async (userId: string) => {
    try {
      await unfollowMutation.mutateAsync(userId);
      queryClient.invalidateQueries({ queryKey: ["followed-users"] });
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to unfollow user:", error);
    }
  };

  if (isLoading) {
    return <FriendsSkeleton isCollapsed={isCollapsed} />;
  }

  const friendCount = followedUsers?.length ?? 0;
  const showScrollArea = friendCount > 10;

  const getContentHeight = () => {
    if (showScrollArea) {
      return "calc(100vh - 300px)";
    }
    const baseHeight = 64;
    const itemHeight = viewType === "grid" ? 100 : 56;
    const gap = 12;
    const rows =
      viewType === "grid" ? Math.ceil((friendCount || 0) / 2) : friendCount;
    return `${baseHeight + (rows * itemHeight) + (rows - 1) * gap}px`;
  };

  return (
    <>
      <Card
        className={`bg-card/80 backdrop-blur-xs transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-12 overflow-hidden" : "w-full"
        }`}
      >
        <CardContent
          className={`transition-all duration-300 ${
            isCollapsed ? "flex justify-center p-2" : "p-4"
          }`}
        >
          {isCollapsed ? (
            <Users className="h-6 w-6 text-muted-foreground" />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <CardTitle className="font-semibold text-muted-foreground text-sm uppercase">
                    {title}
                  </CardTitle>
                  {friendCount > 0 && (
                    <div className="flex items-center">
                      <div className="mx-2 h-1 w-1 rounded-full bg-muted-foreground/25" />
                      <span className="inline-flex h-5 items-center justify-center rounded-full bg-muted/30 px-2 font-medium text-muted-foreground/70 text-xs">
                        {friendCount}
                      </span>
                    </div>
                  )}
                </div>

                <ViewSwitcher onChange={setViewType} view={viewType} />
              </div>

              <div
                className="transition-all duration-300"
                style={{ height: getContentHeight() }}
              >
                {showScrollArea ? (
                  <ScrollArea className="h-full pr-4">
                    <FriendsList
                      followedUsers={followedUsers || []}
                      onUnfollow={handleUnfollow}
                      viewType={viewType}
                    />
                  </ScrollArea>
                ) : (
                  <FriendsList
                    followedUsers={followedUsers || []}
                    onUnfollow={handleUnfollow}
                    viewType={viewType}
                  />
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {userToUnfollow && (
        <UnfollowUserDialog
          handleUnfollow={() => performUnfollow(userToUnfollow.id)}
          onClose={handleCloseDialog}
          open={!!userToUnfollow}
          // @ts-expect-error
          user={userToUnfollow}
        />
      )}
    </>
  );
};

export default Friends;
