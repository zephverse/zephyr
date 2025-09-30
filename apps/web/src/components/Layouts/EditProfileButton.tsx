"use client";

import type { UserData } from "@zephyr/db";
import { Button } from "@zephyr/ui/shadui/button";
import { useState } from "react";
import EditProfileDialog from "@/components/Layouts/EditProfileDialog";
import { cn } from "@/lib/utils";

interface EditProfileButtonProps {
  user: UserData;
  className?: string;
}

export default function EditProfileButton({
  user,
  className,
}: EditProfileButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        className={cn(
          "bg-primary font-medium font-sofiaProSoftMed text-background",
          className
        )}
        onClick={() => setShowDialog(true)}
        variant="outline"
      >
        Edit profile
      </Button>
      <EditProfileDialog
        onOpenChange={setShowDialog}
        open={showDialog}
        user={user}
      />
    </>
  );
}
