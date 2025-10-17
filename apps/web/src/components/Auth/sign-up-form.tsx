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
import { AlertCircle, Mail, User } from "lucide-react";
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
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showOTPPanel, setShowOTPPanel] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 300,
      intervalMs: 1000,
    });
  const verificationChannel = useRef<BroadcastChannel | null>(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    if (showOTPPanel) {
      startCountdown();
    } else {
      stopCountdown();
      resetCountdown();
      setOtp("");
    }
  }, [showOTPPanel, startCountdown, stopCountdown, resetCountdown]);

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
    } catch (otpError) {
      const message =
        otpError instanceof Error
          ? otpError.message
          : "OTP verification failed";
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: message,
      });
      throw otpError;
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
              className="space-y-6"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 8 }}
              key="otp-panel"
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-2 text-center">
                <p className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text font-semibold text-2xl text-transparent">
                  Verify Your Email
                </p>
                <p className="text-muted-foreground">
                  We've sent a 6-digit code to
                </p>
                <p className="rounded-lg border border-border/50 bg-muted/50 px-4 py-2 font-medium text-foreground">
                  {form.getValues("email")}
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  disabled={isVerifyingOTP || count === 0}
                  maxLength={6}
                  onChange={(val) => setOtp(val)}
                  value={otp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} key="otp-slot-0" />
                    <InputOTPSlot index={1} key="otp-slot-1" />
                    <InputOTPSlot index={2} key="otp-slot-2" />
                    <InputOTPSlot index={3} key="otp-slot-3" />
                    <InputOTPSlot index={4} key="otp-slot-4" />
                    <InputOTPSlot index={5} key="otp-slot-5" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-muted-foreground">Code expires in</span>
                  <span
                    className={`font-bold font-mono ${count < 60 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {`${Math.floor(count / 60)}:${String(count % 60).padStart(2, "0")}`}
                  </span>
                </div>
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/60"
                    style={{ width: `${(count / 300) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  disabled={isVerifyingOTP || otp.length !== 6 || count === 0}
                  onClick={() => handleOTPVerification(otp)}
                  type="button"
                >
                  {isVerifyingOTP ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-border/30 border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Having trouble?
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={async () => {
                      if (count > 0 && count < 300) {
                        return;
                      }
                      const { resendVerificationEmail } = await import(
                        "@/app/(auth)/signup/actions"
                      );
                      const result = await resendVerificationEmail(
                        form.getValues("email")
                      );
                      if (result.success) {
                        startCountdown();
                        toast({
                          title: "Code Sent!",
                          description:
                            "A new verification code has been sent to your email.",
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
                    variant="outline"
                  >
                    Resend Code
                  </Button>
                  <Button
                    onClick={async () => {
                      const { sendVerificationLink } = await import(
                        "@/app/(auth)/signup/actions"
                      );
                      const res = await sendVerificationLink(
                        form.getValues("email")
                      );
                      if (res.success) {
                        toast({
                          title: "Email Link Sent!",
                          description:
                            "A verification link has been sent to your email.",
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
                    variant="ghost"
                  >
                    Use Email Link
                  </Button>
                </div>
              </div>
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
