"use client";

import { Users } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No users found",
  description = "There are no users to display at the moment.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-4 rounded-full bg-muted p-3">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 font-semibold text-foreground text-lg">{title}</h3>
      <p className="max-w-md text-center text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}
