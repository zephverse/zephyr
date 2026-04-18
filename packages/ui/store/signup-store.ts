import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface RateLimitInfo {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
}

interface SignupState {
  canCreate: () => boolean;
  canResend: () => boolean;

  canStartSignup: () => boolean;
  canVerify: () => boolean;
  clearRateLimit: (action: keyof SignupState["rateLimits"]) => void;
  currentEmail: string | null;
  isCreating: boolean;
  isResending: boolean;

  isStarting: boolean;
  isVerifying: boolean;
  rateLimits: {
    start: RateLimitInfo;
    resend: RateLimitInfo;
    verify: RateLimitInfo;
    create: RateLimitInfo;
  };

  reset: () => void;
  setCreating: (creating: boolean) => void;
  setCurrentEmail: (email: string | null) => void;

  setRateLimit: (
    action: keyof SignupState["rateLimits"],
    info: Partial<RateLimitInfo>
  ) => void;
  setResending: (resending: boolean) => void;
  setShowEmailVerification: (show: boolean) => void;

  setShowOTPPanel: (show: boolean) => void;

  setStarting: (starting: boolean) => void;
  setVerifying: (verifying: boolean) => void;
  showEmailVerification: boolean;

  showOTPPanel: boolean;
}

const initialRateLimit: RateLimitInfo = {
  remaining: 0,
  resetTime: 0,
  isLimited: false,
};

const initialState = {
  rateLimits: {
    start: { ...initialRateLimit },
    resend: { ...initialRateLimit },
    verify: { ...initialRateLimit },
    create: { ...initialRateLimit },
  },
  isStarting: false,
  isResending: false,
  isVerifying: false,
  isCreating: false,
  showOTPPanel: false,
  showEmailVerification: false,
  currentEmail: null,
};

export const useSignupStore = create<SignupState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setRateLimit: (action, info) =>
        set((state) => {
          const mergedLimits = {
            ...state.rateLimits[action],
            ...info,
          };
          return {
            rateLimits: {
              ...state.rateLimits,
              [action]: {
                ...mergedLimits,
                isLimited:
                  (mergedLimits.remaining ?? 0) <= 0 &&
                  (mergedLimits.resetTime ?? 0) > Date.now() / 1000,
              },
            },
          };
        }),

      clearRateLimit: (action) =>
        set((state) => ({
          rateLimits: {
            ...state.rateLimits,
            [action]: { ...initialRateLimit },
          },
        })),

      setStarting: (starting) => set({ isStarting: starting }),
      setResending: (resending) => set({ isResending: resending }),
      setVerifying: (verifying) => set({ isVerifying: verifying }),
      setCreating: (creating) => set({ isCreating: creating }),

      setShowOTPPanel: (show) => set({ showOTPPanel: show }),
      setShowEmailVerification: (show) => set({ showEmailVerification: show }),
      setCurrentEmail: (email) => set({ currentEmail: email }),

      canStartSignup: () => {
        const { rateLimits, isStarting } = get();
        return !(isStarting || rateLimits.start.isLimited);
      },

      canResend: () => {
        const { rateLimits, isResending } = get();
        return !(isResending || rateLimits.resend.isLimited);
      },

      canVerify: () => {
        const { rateLimits, isVerifying } = get();
        return !(isVerifying || rateLimits.verify.isLimited);
      },

      canCreate: () => {
        const { rateLimits, isCreating } = get();
        return !(isCreating || rateLimits.create.isLimited);
      },

      reset: () =>
        set({
          ...initialState,
          rateLimits: {
            start: { ...initialState.rateLimits.start },
            resend: { ...initialState.rateLimits.resend },
            verify: { ...initialState.rateLimits.verify },
            create: { ...initialState.rateLimits.create },
          },
        }),
    }),
    {
      name: "signup-store",
    }
  )
);

export const useRateLimitCountdown = (
  action: keyof SignupState["rateLimits"]
) => {
  const rateLimit = useSignupStore((state) => state.rateLimits[action]);

  if (!rateLimit.isLimited || rateLimit.resetTime === 0) {
    return { timeLeft: 0, isActive: false };
  }

  const now = Date.now() / 1000;
  const timeLeft = Math.max(0, Math.ceil(rateLimit.resetTime - now));

  return {
    timeLeft,
    isActive: timeLeft > 0,
  };
};
