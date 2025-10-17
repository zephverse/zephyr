import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";

export function useSignupUrlState() {
  const [showOTPPanel, setShowOTPPanel] = useQueryState(
    "otp",
    parseAsBoolean.withDefault(false)
  );

  const [showEmailVerification, setShowEmailVerification] = useQueryState(
    "email_verify",
    parseAsBoolean.withDefault(false)
  );

  const [currentEmail, setCurrentEmail] = useQueryState(
    "email",
    parseAsString.withDefault("")
  );

  const clearSignupState = () => {
    setShowOTPPanel(false);
    setShowEmailVerification(false);
    setCurrentEmail("");
  };

  const setOTPState = (email: string) => {
    setShowOTPPanel(true);
    setShowEmailVerification(false);
    setCurrentEmail(email);
  };

  const setEmailVerificationState = (email: string) => {
    setShowOTPPanel(true);
    setShowEmailVerification(true);
    setCurrentEmail(email);
  };

  return {
    showOTPPanel,
    showEmailVerification,
    currentEmail,
    setShowOTPPanel,
    setShowEmailVerification,
    setCurrentEmail,
    clearSignupState,
    setOTPState,
    setEmailVerificationState,
  };
}
