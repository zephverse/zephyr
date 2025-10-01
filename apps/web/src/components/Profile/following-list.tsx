"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@zephyr/ui/shadui/dialog";
import { Input } from "@zephyr/ui/shadui/input";
import { ScrollArea } from "@zephyr/ui/shadui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, SearchIcon, Users2 } from "lucide-react";
import { useState } from "react";
import FollowButton from "@/components/Layouts/FollowButton";
import UserAvatar from "@/components/Layouts/UserAvatar";

type FollowingListProps = {
  userId: string;
  isOpen: boolean;
  onCloseAction: () => void;
  loggedInUserId: string;
};

type Following = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  _count: {
    followers: number;
  };
  isFollowing: boolean;
};

const emptyStateMessages = [
  "Not following anyone yet? Time to explore! 🗺️",
  "The follow button is feeling lonely! 🥺",
  "Your following list is as empty as a desert! 🏜️",
  "Time to discover some amazing people! ✨",
  "Looking for inspiration? Start following! 🌟",
];

export default function FollowingList({
  userId,
  isOpen,
  onCloseAction,
  loggedInUserId,
}: FollowingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [randomMessage] = useState(
    () =>
      emptyStateMessages[Math.floor(Math.random() * emptyStateMessages.length)]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["following-list", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/following-list`);
      if (!response.ok) {
        throw new Error("Failed to fetch following");
      }
      return response.json() as Promise<Following[]>;
    },
    enabled: isOpen,
  });

  const filteredFollowing = data?.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog onOpenChange={onCloseAction} open={isOpen}>
      <DialogContent className="max-h-[90vh] overflow-hidden border border-accent/20 bg-background/95 backdrop-blur-md sm:max-w-[425px]">
        <DialogHeader>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -20 }}
          >
            <Users2 className="h-5 w-5 text-primary" />
            <DialogTitle>Following</DialogTitle>
          </motion.div>
        </DialogHeader>

        <motion.div
          animate={{ opacity: 1 }}
          className="relative mb-4"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="border-accent/20 bg-background/50 pl-9 backdrop-blur-xs focus:border-primary/50"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search following..."
            value={searchQuery}
          />
        </motion.div>

        <ScrollArea className="-mr-4 h-[60vh] pr-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="space-y-4">
                {[...new Array(5)].map((_, i) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex animate-pulse items-center space-x-4"
                    initial={{ opacity: 0, y: 20 }}
                    key={`following-skeleton-${i + 1}`}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded-sm bg-muted" />
                      <div className="h-3 w-32 rounded-sm bg-muted" />
                    </div>
                  </motion.div>
                ))}
              </div>
              // biome-ignore lint/style/noNestedTernary: ignore
            ) : !data || filteredFollowing?.length === 0 ? (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center space-y-4 py-12 text-center"
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
              >
                <Compass className="h-16 w-16 animate-bounce text-muted-foreground" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground text-lg">
                    {randomMessage}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Discover and follow people to see their posts!
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {filteredFollowing?.map((user, index) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="group relative flex items-center justify-between rounded-lg p-3 backdrop-blur-xs transition-all duration-200 hover:bg-accent/50"
                    initial={{ opacity: 0, x: -20 }}
                    key={user.id}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center space-x-3">
                      <UserAvatar
                        avatarUrl={user.avatarUrl}
                        className="rounded-full ring-2 ring-background/50 transition-transform group-hover:scale-105"
                        size={40}
                      />
                      <div>
                        <p className="line-clamp-1 font-medium">
                          {user.displayName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    {user.id !== loggedInUserId && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FollowButton
                          initialState={{
                            isFollowedByUser: user.isFollowing,
                            followers: user._count.followers,
                          }}
                          userId={user.id}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
