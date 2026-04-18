import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = ({
  className,
  variant,
  ref,
  ...props
}: (HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) & {
  ref?: React.Ref<HTMLDivElement | null>;
}) => (
  <div
    className={cn(alertVariants({ variant }), className)}
    ref={ref}
    role="alert"
    {...props}
  />
);
Alert.displayName = "Alert";

const AlertTitle = ({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & {
  ref?: React.Ref<HTMLParagraphElement | null>;
}) => (
  <h5
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    ref={ref}
    {...props}
  />
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = ({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.Ref<HTMLParagraphElement | null>;
}) => (
  <div
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    ref={ref}
    {...props}
  />
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };
