"use client";

import { Bookmark } from "lucide-react";
import { usePathname } from "next/navigation";
import { HeaderIconButton } from "@/components/Styles/header-buttons";

type HeaderBookmarksButtonProps = {
  count: number;
};

export default function HeaderBookmarksButton({
  count,
}: HeaderBookmarksButtonProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/bookmarks");

  return (
    <HeaderIconButton
      count={count}
      href="/bookmarks"
      icon={
        <>
          <Bookmark className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
          {isActive && (
            <span className="-bottom-2 -translate-x-1/2 pointer-events-none absolute left-1/2 h-1 w-1 rounded-full bg-primary" />
          )}
        </>
      }
      title="Bookmarks"
    />
  );
}
