"use client";

import { Input } from "@zephyr/ui/shadui/input";
import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChangeAction: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeAction,
  placeholder = "Search users...",
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-10"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChangeAction(e.target.value)
        }
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </div>
  );
}
