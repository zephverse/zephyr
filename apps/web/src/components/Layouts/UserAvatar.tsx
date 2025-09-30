import avatarPlaceholder from "@assets/general/avatar-placeholder.png";
import type { UserData } from "@zephyr/db";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: Pick<UserData, "avatarUrl"> | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  priority?: boolean;
}

export default function UserAvatar({
  user,
  avatarUrl: directAvatarUrl,
  size,
  className,
  priority = false,
}: UserAvatarProps) {
  const avatarUrl = user?.avatarUrl ?? directAvatarUrl;

  return (
    <Image
      alt="User avatar"
      className={cn(
        "aspect-square h-fit flex-none rounded-xl bg-secondary object-cover",
        className
      )}
      height={size ?? 48}
      priority={priority}
      src={avatarUrl || avatarPlaceholder}
      unoptimized={avatarUrl?.endsWith(".gif")}
      width={size ?? 48} // Don't optimize GIFs to keep animation
    />
  );
}
