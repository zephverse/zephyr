import { HNFeed } from "@zephyr/ui/components/hackernews/hn-feed";
import { Suspense } from "react";
import FeedViewSkeleton from "@/components/Layouts/skeletons/feed-view-skeleton";

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
