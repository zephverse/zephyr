"use client";

import { DotFilledIcon } from "@radix-ui/react-icons";
import { Indicator, Item, Root } from "@radix-ui/react-radio-group";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { cn } from "../lib/utils";

const RadioGroup = forwardRef<
  ElementRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
  <Root className={cn("grid gap-2", className)} {...props} ref={ref} />
));
RadioGroup.displayName = Root.displayName;

const RadioGroupItem = forwardRef<
  ElementRef<typeof Item>,
  ComponentPropsWithoutRef<typeof Item>
>(({ className, ...props }, ref) => (
  <Item
    className={cn(
      "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow-sm focus:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    <Indicator className="flex items-center justify-center">
      <DotFilledIcon className="h-3.5 w-3.5 fill-primary" />
    </Indicator>
  </Item>
));
RadioGroupItem.displayName = Item.displayName;

export { RadioGroup, RadioGroupItem };
