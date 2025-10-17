"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@root/env";
import { type SignUpValues, signUpSchema } from "@zephyr/auth/validation";
import { FlipWords } from "@zephyr/ui/components/ui/flip-words";
import { useToast } from "@zephyr/ui/hooks/use-toast";
import { useVerification } from "@zephyr/ui/providers/verification";
import { Button } from "@zephyr/ui/shadui/button";
import { Checkbox } from "@zephyr/ui/shadui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@zephyr/ui/shadui/form";
import { Input } from "@zephyr/ui/shadui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@zephyr/ui/shadui/input-otp";
import { AlertCircle, ArrowLeft, Mail, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  type FieldValues,
  type SubmitErrorHandler,
  useForm,
} from "react-hook-form";
import { useCountdown } from "usehooks-ts";
import { signUp } from "@/app/(auth)/signup/actions";
import { LoadingButton } from "@/components/Auth/loading-button";
import { PasswordInput } from "@/components/Auth/password-input";
import { PasswordStrengthChecker } from "./password-strength-checker";

const texts = [
  "All your worlds, one feed.",
  "The pulse of your digital life.",
  "Stream everything that matters.",
  "Unify your social universe.",
  "Where every post finds you.",
];

const DIGITS_ONLY_REGEX = /^\d*$/;

type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) {
    return maybeError;
  }
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ignore
export default function SignUpForm() {
  const { toast } = useToast();
  const { setIsVerifying } = useVerification();
  const ageVerifyId = useId();
  const termsId = useId();
  const [error, setError] = useState<string>();
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showOTPPanel, setShowOTPPanel] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 300,
      intervalMs: 1000,
    });
  const [
    resendCount,
    {
      startCountdown: startResendCountdown,
      resetCountdown: resetResendCountdown,
    },
  ] = useCountdown({
    countStart: 60,
    intervalMs: 1000,
  });
  const verificationChannel = useRef<BroadcastChannel | null>(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    verificationChannel.current = new BroadcastChannel("email-verification");

    const handleVerificationSuccess = () => {
      setIsVerifying(false);
      window.location.reload();
    };

    verificationChannel.current.addEventListener("message", (event) => {
      if (event.data === "verification-success") {
        handleVerificationSuccess();
      }
    });

    return () => {
      if (verificationChannel.current) {
        verificationChannel.current.close();
      }
    };
  }, [setIsVerifying]);

  useEffect(() => {
    if (showOTPPanel && !showEmailVerification) {
      startCountdown();
    } else {
      stopCountdown();
      resetCountdown();
      setOtp("");
    }
  }, [
    showOTPPanel,
    showEmailVerification,
    startCountdown,
    stopCountdown,
    resetCountdown,
  ]);

  const handleInvalidSubmit: SubmitErrorHandler<FieldValues> = useCallback(
    (errors) => {
      const firstError = Object.values(errors)[0];
      const errorMessage =
        (firstError?.message as string) || "Please check your input";

      toast({
        variant: "destructive",
        title: "Oopsie daisy!",
        description: errorMessage,
        duration: 3000,
      });

      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToError(firstErrorField);
      }
    },
    [toast]
  );

  const onSubmit = (values: SignUpValues) => {
    setError(undefined);
    if (!(isAgeVerified && acceptedTerms)) {
      toast({
        variant: "destructive",
        title: "Hold up!",
        description:
          "You gotta check those boxes, we can't let just anyone join the squad!",
        duration: 3000,
      });
      return;
    }
    startTransition(async () => {
      try {
        setIsLoading(true);
        const result = await signUp(values);

        if (result.success) {
          setShowOTPPanel(true);
          toast({
            title: "Check Your Email!",
            description: "We've sent a verification code to your email.",
          });
        } else if (result.error) {
          const msg = String(result.error);
          setError(msg);
          toast({
            variant: "destructive",
            title: "Signup Failed!",
            description: msg,
          });
        }
      } catch (signupError) {
        const errorMessage = toErrorWithMessage(signupError).message;
        console.error("Signup error:", signupError);
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Something went wrong!",
          description:
            process.env.NODE_ENV === "development"
              ? errorMessage
              : "An unexpected error occurred, try again? Our bad!",
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: it's fine
  const handleOTPVerification = async (otpValue: string) => {
    try {
      setIsVerifyingOTP(true);
      setOtpError(false);
      const email = form.getValues("email");
      const authBase = env.NEXT_PUBLIC_AUTH_URL;
      const res = await fetch(`${authBase}/api/trpc/pendingSignupVerify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: 1,
          json: {
            email,
            otp: otpValue,
            otpVerified: true,
          },
        }),
      });

      const data = await res.json().catch(() => ({}) as unknown);

      if (!(res.ok && data?.result?.data?.json?.success)) {
        const serverError =
          data?.result?.error?.message ||
          data?.result?.data?.json?.error ||
          "Signup completion failed";

        let userFriendlyError = "Something went wrong. Please try again.";
        if (serverError === "invalid-otp") {
          userFriendlyError =
            "The verification code is incorrect. Please check and try again.";
          setOtpError(true);
          setOtp("");
        } else if (serverError === "user-exists") {
          userFriendlyError =
            "An account with this email or username already exists.";
        } else if (serverError === "no-pending-signup") {
          userFriendlyError =
            "Your verification session has expired. Please start over.";
        }

        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: userFriendlyError,
        });
        throw new Error(serverError);
      }

      const responseData = data?.result?.data?.json;
      const responseEmail = responseData?.email;
      const responsePassword = responseData?.password;

      if (responseEmail && responsePassword) {
        try {
          console.log("Attempting auto-login with:", { email: responseEmail });
          const { authClient } = await import("@/lib/auth");
          await authClient.signIn.email({
            email: responseEmail,
            password: responsePassword,
            fetchOptions: {
              onError: () => {
                throw new Error("Auto-login failed");
              },
            },
          });

          console.log("Auto-login API call completed successfully");
          verificationChannel.current?.postMessage("verification-success");
          setShowOTPPanel(false);
          setIsVerifying(true);
          toast({
            title: "Welcome to Zephyr! 🎉",
            description:
              "Your account has been created and you're now logged in.",
          });
          setTimeout(() => {
            console.log("Reloading page after successful login");
            window.location.reload();
          }, 500);
          return;
        } catch (signError) {
          console.error("Auto sign-in failed:", signError);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description:
              "Account created but automatic login failed. Please log in manually.",
          });
        }
      } else {
        console.log("No email/password returned for auto-login");
      }

      setShowOTPPanel(false);
      setIsVerifying(true);
      toast({
        title: "Welcome to Zephyr! 🎉",
        description: "Your account has been created successfully.",
      });
      verificationChannel.current?.postMessage("verification-success");
      setTimeout(() => window.location.reload(), 100);
    } catch (verificationError) {
      const message =
        verificationError instanceof Error
          ? verificationError.message
          : "OTP verification failed";
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: message,
      });
      throw verificationError;
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center text-sm">
        <FlipWords
          className="font-semibold text-gray-500 sm:text-base"
          words={texts}
        />
      </div>
      <div className="relative">
        <AnimatePresence initial={false} mode="wait">
          {!showOTPPanel && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 8 }}
              key="signup-form"
              transition={{ duration: 0.25 }}
            >
              <Form {...form}>
                <form
                  autoComplete="on"
                  className="space-y-3"
                  noValidate
                  onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
                >
                  {error && (
                    <div className="rounded-lg bg-destructive/15 p-3 text-center text-destructive text-sm">
                      <p className="flex items-center justify-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </p>
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="cooluser"
                              {...field}
                              autoComplete="username"
                              className={`transition-all duration-500 ease-in-out ${
                                hoveredField === "username"
                                  ? "border-primary shadow-lg shadow-primary/20"
                                  : ""
                              }`}
                              name="username"
                              onMouseEnter={() => setHoveredField("username")}
                              onMouseLeave={() => setHoveredField(null)}
                            />
                            <User className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="you@example.com"
                              type="email"
                              {...field}
                              autoComplete="email"
                              className={`transition-all duration-500 ease-in-out ${
                                hoveredField === "email"
                                  ? "border-primary shadow-lg shadow-primary/20"
                                  : ""
                              }`}
                              name="email"
                              onMouseEnter={() => setHoveredField("email")}
                              onMouseLeave={() => setHoveredField(null)}
                            />
                            <Mail className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            {...field}
                            autoComplete="new-password"
                            className={`transition-all duration-500 ease-in-out ${
                              hoveredField === "password"
                                ? "border-primary shadow-lg shadow-primary/20"
                                : ""
                            }`}
                            name="password"
                            onChange={(e) => {
                              field.onChange(e);
                              setPassword(e.target.value);
                            }}
                            onMouseEnter={() => setHoveredField("password")}
                            onMouseLeave={() => setHoveredField(null)}
                          />
                        </FormControl>
                        <PasswordStrengthChecker
                          password={password}
                          setPassword={setPassword}
                          setValue={form.setValue}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isAgeVerified}
                        className={`border-primary/20 transition-all duration-500 ease-in-out data-[state=checked]:border-primary/80 data-[state=checked]:bg-primary/80 ${
                          hoveredField === "ageVerify"
                            ? "border-primary shadow-lg shadow-primary/20"
                            : ""
                        }`}
                        id={ageVerifyId}
                        onCheckedChange={(checked) =>
                          setIsAgeVerified(checked as boolean)
                        }
                        onMouseEnter={() => setHoveredField("ageVerify")}
                        onMouseLeave={() => setHoveredField(null)}
                      />
                      <label
                        className="text-muted-foreground text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor={ageVerifyId}
                      >
                        Yes, I've survived enough birthdays to be here
                      </label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        checked={acceptedTerms}
                        className={`mt-1 border-primary/20 transition-all duration-500 ease-in-out data-[state=checked]:border-primary/80 data-[state=checked]:bg-primary/80 ${
                          hoveredField === "terms"
                            ? "border-primary shadow-lg shadow-primary/20"
                            : ""
                        }`}
                        id={termsId}
                        onCheckedChange={(checked) =>
                          setAcceptedTerms(checked as boolean)
                        }
                        onMouseEnter={() => setHoveredField("terms")}
                        onMouseLeave={() => setHoveredField(null)}
                      />
                      <label
                        className="text-muted-foreground text-sm leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor={termsId}
                      >
                        I agree to the{" "}
                        <Link
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          href="/toc"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          href="/privacy"
                        >
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    <LoadingButton
                      className="my-4 w-full"
                      loading={isPending || isLoading}
                      type="submit"
                    >
                      Create account
                    </LoadingButton>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="mt-2 w-full border-border/30 border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="mt-2 px-2 text-muted-foreground">
                        or continue with
                      </span>
                    </div>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {showOTPPanel && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="relative space-y-6"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 8 }}
              key="otp-panel"
              transition={{ duration: 0.25 }}
            >
              {showEmailVerification ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 p-6"
                  exit={{ opacity: 0, y: 20 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    className="group -ml-2 -mt-2 mb-2 flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                    onClick={() => setShowEmailVerification(false)}
                    type="button"
                  >
                    <ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
                    <span>Back to Code Entry</span>
                  </button>
                  <div className="flex flex-col items-center space-y-2 pt-2 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-md" />
                      <div className="relative rounded-full border border-primary/20 bg-background/80 p-4 backdrop-blur-sm">
                        <Mail className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text font-bold text-2xl text-transparent">
                        Check Your Email
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <p className="text-muted-foreground text-sm">
                        We've sent a verification link to
                      </p>
                      <p className="rounded-lg border border-border/50 bg-muted/50 px-4 py-2 font-medium text-foreground">
                        {form.getValues("email")}
                      </p>
                    </div>

                    <div className="w-full space-y-3 pt-2">
                      <Button
                        className="w-full cursor-pointer bg-accent text-accent-foreground"
                        disabled={
                          isResending || (resendCount > 0 && resendCount < 60)
                        }
                        onClick={async () => {
                          if (resendCount > 0 && resendCount < 60) {
                            return;
                          }
                          setIsResending(true);
                          const { sendVerificationLink } = await import(
                            "@/app/(auth)/signup/actions"
                          );
                          const res = await sendVerificationLink(
                            form.getValues("email")
                          );
                          if (res.success) {
                            resetResendCountdown();
                            startResendCountdown();
                            toast({
                              title: "Email Sent!",
                              description:
                                "A new verification link has been sent to your email.",
                            });
                          } else {
                            toast({
                              variant: "destructive",
                              title: "Failed to Send",
                              description:
                                res.error ||
                                "Failed to send verification link.",
                            });
                          }
                          setIsResending(false);
                        }}
                        type="button"
                        variant="secondary"
                      >
                        {(() => {
                          if (isResending) {
                            return "Sending...";
                          }
                          if (resendCount > 0 && resendCount < 60) {
                            return `Resend available in ${resendCount}s`;
                          }
                          return "Resend verification email";
                        })()}
                      </Button>

                      <details className="group">
                        <summary className="flex cursor-pointer items-center justify-center gap-1 text-center text-muted-foreground text-xs transition-colors hover:text-foreground">
                          <span>More info</span>
                          <svg
                            className="h-3 w-3 transition-transform group-open:rotate-180"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <title>Toggle more info</title>
                            <path
                              d="M19 9l-7 7-7-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </summary>
                        <p className="mt-2 text-center text-muted-foreground text-xs">
                          Please check your inbox to complete your registration
                          or Check your spam folder if you don't see the email
                          in your inbox
                        </p>
                      </details>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                  exit={{ opacity: 0, y: -20 }}
                  initial={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6 p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1 text-left">
                        <h2 className="font-bold text-foreground text-lg sm:text-2xl">
                          Verify Your Email
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          Enter the 6-digit code sent to
                        </p>
                        <p className="truncate font-medium text-foreground text-xs sm:text-sm">
                          {form.getValues("email")}
                        </p>
                      </div>

                      <div className="relative shrink-0">
                        <motion.button
                          animate={
                            count === 0 && !tooltipDismissed
                              ? {
                                  y: [0, -8, 0],
                                  transition: {
                                    duration: 0.6,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                  },
                                }
                              : {}
                          }
                          className="group relative h-12 w-12 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-16"
                          disabled={count > 0 && count < 300}
                          onClick={async () => {
                            if (count > 0 && count < 300) {
                              return;
                            }
                            setTooltipDismissed(true);
                            const { resendVerificationEmail } = await import(
                              "@/app/(auth)/signup/actions"
                            );
                            const result = await resendVerificationEmail(
                              form.getValues("email")
                            );
                            if (result.success) {
                              resetCountdown();
                              startCountdown();
                              setOtp("");
                              setTooltipDismissed(false);
                              toast({
                                title: "Code Sent!",
                                description:
                                  "A new verification code has been sent.",
                              });
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Failed to Resend",
                                description:
                                  result.error ||
                                  "Failed to resend verification code.",
                              });
                            }
                          }}
                          type="button"
                        >
                          <svg
                            className="-rotate-90 h-full w-full transform"
                            viewBox="0 0 100 100"
                          >
                            <title>Resend verification code timer</title>
                            <circle
                              className="stroke-muted"
                              cx="50"
                              cy="50"
                              fill="none"
                              r="45"
                              strokeWidth="8"
                            />
                            <motion.circle
                              animate={{
                                strokeDashoffset: 283 - (count / 300) * 283,
                              }}
                              className={`transition-colors ${count < 60 ? "stroke-destructive" : "stroke-primary"}`}
                              cx="50"
                              cy="50"
                              fill="none"
                              r="45"
                              strokeDasharray="283"
                              strokeDashoffset="283"
                              strokeLinecap="round"
                              strokeWidth="8"
                              transition={{ duration: 1, ease: "linear" }}
                            />
                          </svg>
                          {count === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl sm:text-2xl">↻</span>
                            </div>
                          )}
                        </motion.button>

                        <AnimatePresence>
                          {count === 0 && !tooltipDismissed && (
                            <motion.div
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute top-full right-0 z-10 mt-2 w-40 rounded-lg border border-border bg-popover p-2.5 text-popover-foreground shadow-lg sm:w-48 sm:p-3"
                              exit={{ opacity: 0, scale: 0.95 }}
                              initial={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                            >
                              <p className="text-[10px] sm:text-xs">
                                Code expired! Click the button to resend a new
                                verification code.
                              </p>
                              <div className="-top-2 absolute right-4 h-4 w-4 rotate-45 border-border border-t border-l bg-popover" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <motion.div
                      animate={otpError ? { x: [-10, 10, -10, 10, 0] } : {}}
                      className="flex justify-center"
                      transition={{ duration: 0.4 }}
                    >
                      <InputOTP
                        disabled={isVerifyingOTP || count === 0}
                        maxLength={6}
                        onChange={(val) => {
                          if (DIGITS_ONLY_REGEX.test(val)) {
                            setOtp(val);
                            setOtpError(false);
                            if (val.length === 6) {
                              handleOTPVerification(val);
                            }
                          } else {
                            setOtpError(true);
                            toast({
                              variant: "destructive",
                              title: "Numbers only, please!",
                              description:
                                "We're looking for digits, not your life story!",
                              duration: 2000,
                            });
                          }
                        }}
                        pattern="[0-9]*"
                        value={otp}
                      >
                        <InputOTPGroup className="gap-2.5">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <motion.div
                              animate={
                                otp[index]
                                  ? {
                                      scale: [1, 1.1, 1],
                                      rotate: [0, 5, -5, 0],
                                    }
                                  : {}
                              }
                              key={`otp-slot-${index}`}
                              transition={{ duration: 0.3 }}
                            >
                              <InputOTPSlot index={index} />
                            </motion.div>
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </motion.div>

                    <Button
                      className="w-full cursor-pointer bg-accent text-accent-foreground"
                      onClick={async () => {
                        const { sendVerificationLink } = await import(
                          "@/app/(auth)/signup/actions"
                        );
                        const res = await sendVerificationLink(
                          form.getValues("email")
                        );
                        if (res.success) {
                          setShowEmailVerification(true);
                          toast({
                            title: "Email Link Sent!",
                            description:
                              "Check your inbox for the verification link.",
                          });
                        } else {
                          toast({
                            variant: "destructive",
                            title: "Failed to Send",
                            description:
                              res.error || "Failed to send verification link.",
                          });
                        }
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Verify via Email Link Instead
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function scrollToError(fieldName: string) {
  requestAnimationFrame(() => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });
}
