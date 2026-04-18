"use client";

import { Content, List, Root, Trigger } from "@radix-ui/react-tabs";
import type * as React from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";

import { cn } from "../lib/utils";

const Tabs = Root;

const TabsList = ({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof List> & {
  ref?: React.Ref<ElementRef<typeof List> | null>;
}) => (
  <List
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    ref={ref}
    {...props}
  />
);
TabsList.displayName = List.displayName;

const TabsTrigger = ({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof Trigger> & {
  ref?: React.Ref<ElementRef<typeof Trigger> | null>;
}) => (
  <Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium text-sm ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    ref={ref}
    {...props}
  />
);
TabsTrigger.displayName = Trigger.displayName;

const TabsContent = ({
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof Content> & {
  ref?: React.Ref<ElementRef<typeof Content> | null>;
}) => (
  <Content
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    ref={ref}
    {...props}
  />
);
TabsContent.displayName = Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
