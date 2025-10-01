import { atomWithStorage } from "jotai/utils";

type FollowState = {
  [userId: string]: {
    isFollowing: boolean;
    followers: number;
    lastUpdated: number;
  };
};

export const followStateAtom = atomWithStorage<FollowState>("follow-state", {});
