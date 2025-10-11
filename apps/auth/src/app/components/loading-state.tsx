"use client";

import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "Loading users...",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
