"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { AlertCircle, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useId, useState, useTransition } from "react";
import {
  type FieldValues,
  type SubmitErrorHandler,
  useForm,
} from "react-hook-form";
import { useCountdown } from "usehooks-ts";
import { resendVerificationEmail, signUp } from "@/app/(auth)/signup/actions";
import { LoadingButton } from "@/components/Auth/loading-button";
import { PasswordInput } from "@/components/Auth/password-input";
import { PasswordStrengthChecker } from "./password-strength-checker";

const texts = [
  "Elevate your ideas, accelerate your impact.",
  "Transform thoughts into action.",
  "Your journey to greatness starts here.",
  "Start Your Adventure",
  "Let parazeeknova cook",
  "Dive In!",
];

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

export default function SignUpForm() {
  const { toast } = useToast();
  const { setIsVerifying } = useVerification();
  const ageVerifyId = useId();
  const termsId = useId();
  const [error, setError] = useState<string>();
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerificationEmailSent, setIsVerificationEmailSent] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const verificationChannel = new BroadcastChannel("email-verification");
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 60,
      intervalMs: 1000,
    });

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
    if (count === 0) {
      stopCountdown();
      resetCountdown();
    }
  }, [count, stopCountdown, resetCountdown]);

  useEffect(() => {
    const handleVerificationSuccess = () => {
      setIsVerifying(false);
      window.location.reload();
    };

    verificationChannel.addEventListener("message", (event) => {
      if (event.data === "verification-success") {
        handleVerificationSuccess();
      }
    });

    return () => {
      verificationChannel.close();
    };
  }, [setIsVerifying, verificationChannel]);

  const handleInvalidSubmit: SubmitErrorHandler<FieldValues> = useCallback(
    (errors) => {
      const firstError = Object.values(errors)[0];
      const errorMessage =
        (firstError?.message as string) || "Please check your input";

      toast({
        variant: "destructive",
        title: "Oopsie daisy! 🤭",
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
          setIsVerifying(true);
          setIsVerificationEmailSent(true);
          startCountdown();
          toast({
            title: "Verify Your Email!",
            description:
              "Check your inbox for the verification email, it's in there somewhere!",
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

  const onResendVerificationEmail = async () => {
    if (count > 0 && count < 60) {
      return;
    }

    try {
      setIsResending(true);
      const email = form.getValues("email");
      const result = await resendVerificationEmail(email);

      if (result.success) {
        startCountdown();
        toast({
          title: "Email Sent!",
          description: "A new verification email has been sent to your inbox!",
          duration: 3000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Resend",
          description:
            result.error || "Failed to resend verification email, try again?",
          duration: 5000,
        });
      }
    } catch (resendError) {
      console.error("Error resending verification email:", resendError);
      toast({
        variant: "destructive",
        title: "Something went wrong!",
        description: "Failed to resend verification email, try again? Our bad!",
      });
    } finally {
      setIsResending(false);
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
        <div
          className={`transition-all duration-500 ease-in-out ${
            isVerificationEmailSent
              ? "pointer-events-none translate-y-[-20px] transform opacity-0"
              : "translate-y-0 transform opacity-100"
          }`}
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
        </div>

        <div
          className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${
            isVerificationEmailSent
              ? "translate-y-0 transform opacity-100"
              : "pointer-events-none translate-y-[20px] transform opacity-0"
          }`}
        >
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 p-8 shadow-lg backdrop-blur-xl">
            <div className="-z-10 absolute inset-0 overflow-hidden">
              <div className="-left-4 absolute top-0 h-[200px] w-[200px] rounded-full bg-primary/10 blur-[50px]" />
              <div className="absolute top-1/2 right-0 h-[150px] w-[150px] rounded-full bg-purple-500/10 blur-[50px]" />
            </div>

            <div className="flex flex-col items-center space-y-6 text-center">
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
                <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-primary/5 via-primary/60 to-primary/5" />
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  We've sent a verification link to
                </p>
                <p className="rounded-lg border border-border/50 bg-muted/50 px-4 py-2 font-medium text-foreground">
                  {form.getValues("email")}
                </p>
                <p className="text-muted-foreground text-sm">
                  Please check your inbox to complete your registration
                </p>
              </div>

              <div className="w-full space-y-4 pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-border/30 border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/60 px-2 text-muted-foreground backdrop-blur-sm">
                      Didn't receive the email?
                    </span>
                  </div>
                </div>

                <Button
                  className="group relative w-full overflow-hidden rounded-lg border border-border/50 bg-background/50 transition-all hover:bg-background/80"
                  disabled={isResending || (count > 0 && count < 60)}
                  onClick={onResendVerificationEmail}
                  variant="ghost"
                >
                  {(() => {
                    if (isResending) {
                      return (
                        <span className="relative text-muted-foreground">
                          Sending...
                        </span>
                      );
                    }
                    if (count > 0 && count < 60) {
                      return (
                        <>
                          <motion.div
                            animate={{ width: "0%" }}
                            className="absolute top-0 left-0 h-full bg-primary/10"
                            initial={{ width: "100%" }}
                            transition={{ duration: count, ease: "linear" }}
                          />
                          <span className="relative text-muted-foreground">
                            Resend available in {count}s
                          </span>
                        </>
                      );
                    }
                    return (
                      <span className="relative text-primary">
                        Resend verification email
                      </span>
                    );
                  })()}
                </Button>

                <p className="text-center text-muted-foreground text-xs">
                  Check your spam folder if you don't see the email in your
                  inbox
                </p>
              </div>
            </div>
          </div>
        </div>
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
