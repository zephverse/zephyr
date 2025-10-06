import type React from "react";
import { cn } from "../lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "field-sizing-content flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:shadow-lg focus-visible:shadow-primary/20 focus-visible:ring-[3px] focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm md:hover:shadow-md md:hover:shadow-primary/10 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      data-slot="textarea"
      {...props}
    />
  );
}

export { Textarea };
