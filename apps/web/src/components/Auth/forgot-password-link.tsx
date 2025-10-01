"use client";

// @ts-expect-error - no types
import resetPasswordImage from "@assets/previews/passwordreset.png";
import { HelpLink } from "../Animations/image-link-preview";

export default function ForgotPasswordLink() {
  return (
    <HelpLink
      href="/reset-password"
      previewImage={resetPasswordImage.src}
      text="Forgot your password?"
    />
  );
}
