import { HNFeed } from "@zephyr/ui/components/hackernews/HNFeed";
import { Suspense } from "react";
import FeedViewSkeleton from "@/components/Layouts/skeletons/FeedViewSkeleton";

export const metadata = {
  title: "HackerNews",
  description: "Explore the latest stories from HackerNews",
};

export default function HackerNewsPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<FeedViewSkeleton />}>
        <HNFeed />
      </Suspense>
    </div>
  );
}
