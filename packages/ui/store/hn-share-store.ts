import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HNStoryType } from "../components/hackernews";

interface HnShareState {
  cancelSharing: () => void;
  clearState: () => void;
  isSharing: boolean;
  setStory: (story: HNStoryType | null) => void;
  startSharing: (story: HNStoryType) => void;
  story: HNStoryType | null;
}

export const useHnShareStore = create<HnShareState>()(
  persist(
    (set) => ({
      story: null,
      isSharing: false,
      setStory: (story) => set({ story }),
      startSharing: (story) => set({ story, isSharing: true }),
      cancelSharing: () => set({ isSharing: false }),
      clearState: () => set({ story: null, isSharing: false }),
    }),
    {
      name: "hn-share-storage",
    }
  )
);
