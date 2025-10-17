"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import React from "react";
import { cn } from "../lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    className={cn("disabled:cursor-not-allowed", className)}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    ref={ref}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div className={cn("flex items-center", className)} ref={ref} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOtpContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOtpContext.slots[index];

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border border-primary/20 bg-background text-sm shadow-sm transition-all duration-300 first:rounded-l-lg first:border-l last:rounded-r-lg focus-within:border-primary/60 hover:border-primary/40",
        isActive && "z-10 shadow-lg shadow-primary/10 ring-2 ring-primary/20",
        className
      )}
      ref={ref}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-primary duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"hr">,
  React.ComponentPropsWithoutRef<"hr">
>(({ className, ...props }, ref) => (
  <hr
    className={cn(
      "flex h-4 w-[1px] items-center justify-center bg-border",
      className
    )}
    ref={ref}
    {...props}
  />
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
