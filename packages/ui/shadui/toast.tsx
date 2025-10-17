/** biome-ignore-all lint/performance/noNamespaceImport: shadcnui */
"use client";

import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { BadgeAlert, BadgeCheck, X } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    className={cn(
      "fixed right-0 bottom-0 z-[99999] flex max-h-screen flex-col p-4 md:max-w-[420px]",
      className
    )}
    ref={ref}
    style={{ isolation: "isolate" }}
    {...props}
  />
));

const toastVariants = cva(
  "group data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full data-[state=open]:sm:slide-in-from-bottom-full pointer-events-auto relative flex flex-col gap-1 overflow-hidden rounded-lg border p-4 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[swipe=end]:animate-out data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "border-border/50",
        destructive: "destructive group border-destructive/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type ToastIconProps = {
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
};

const ToastIcon = ({ icon, variant }: ToastIconProps) => {
  if (icon) {
    return <div className="shrink-0">{icon}</div>;
  }

  if (variant === "destructive") {
    return <BadgeAlert className="h-5 w-5 shrink-0" />;
  }

  return <BadgeCheck className="h-5 w-5 shrink-0" />;
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      icon?: React.ReactNode;
    }
>(({ className, variant, icon, ...props }, ref) => {
  const bgColor =
    variant === "destructive" ? "hsl(var(--destructive))" : "hsl(var(--card))";
  const textColor =
    variant === "destructive"
      ? "hsl(var(--destructive-foreground))"
      : "hsl(var(--card-foreground))";

  return (
    <ToastPrimitives.Root
      asChild
      className={cn(toastVariants({ variant }), className)}
      ref={ref}
      {...props}
    >
      <motion.li
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          },
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: -10,
          transition: {
            duration: 0.25,
            ease: [0.4, 0, 1, 1],
          },
        }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        layout
        style={{
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        <div className="flex items-center gap-3 pr-10">
          {/* @ts-expect-error- TSX Intrinsic class issue */}
          <ToastIcon icon={icon} variant={variant} />
          <div className="min-w-0 flex-1">{props.children}</div>
        </div>
      </motion.li>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 font-medium text-sm transition-colors hover:bg-secondary focus:outline-hidden focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:focus:ring-destructive group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground",
      className
    )}
    ref={ref}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    asChild
    className={cn(
      "absolute top-2 right-2 rounded-md p-1.5 text-foreground/60 transition-all hover:bg-foreground/10 hover:text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50 group-[.destructive]:text-destructive-foreground/80 group-[.destructive]:hover:bg-destructive-foreground/20 group-[.destructive]:hover:text-destructive-foreground",
      className
    )}
    ref={ref}
    toast-close=""
    {...props}
  >
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <X className="h-4 w-4 shrink-0" />
    </motion.button>
  </ToastPrimitives.Close>
));

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    className={cn(
      "font-semibold text-sm leading-tight [&+div]:text-xs",
      className
    )}
    ref={ref}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    className={cn("text-sm leading-relaxed opacity-95", className)}
    ref={ref}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
