"use server";

import { hash } from "@node-rs/argon2";
import { createStreamUser, lucia } from "@zephyr/auth/src";
import {
  isDevelopmentMode,
  isEmailServiceConfigured,
  sendVerificationEmail,
} from "@zephyr/auth/src/email/service";
import { EMAIL_ERRORS, isEmailValid } from "@zephyr/auth/src/email/validation";
// biome-ignore lint/style/noExportedImports: it's a shared utility
import { resendVerificationEmail } from "@zephyr/auth/src/verification/resend";
import { type SignUpValues, signUpSchema } from "@zephyr/auth/validation";
import { getEnvironmentMode, isStreamConfigured } from "@zephyr/config/src/env";
import { prisma } from "@zephyr/db";
import jwt from "jsonwebtoken";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";

type SignUpResponse = {
  verificationUrl?: string;
  error?: string;
  success: boolean;
  skipVerification?: boolean;
  message?: string;
};

const USERNAME_ERRORS = {
  taken: "This username is already taken. Please choose another.",
  invalid: "Username can only contain letters, numbers, and underscores.",
  required: "Username is required",
  creationFailed: "Failed to create user account",
};

const SYSTEM_ERRORS = {
  jwtSecret: "System configuration error: JWT_SECRET is not configured",
  userId: "Failed to generate user ID",
  token: "Failed to generate verification token",
  invalidPayload: "Invalid token payload data",
  sessionCreation: "Failed to create user session",
};

// biome-ignore lint/correctness/noUnusedVariables: this is a shared utility
const { isDevelopment, isProduction } = getEnvironmentMode();

async function createDevUser(
  userId: string,
  username: string,
  email: string,
  passwordHash: string
): Promise<{ streamChatEnabled: boolean }> {
  try {
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        passwordHash,
        emailVerified: true,
      },
    });

    let streamChatEnabled = false;
    if (isStreamConfigured()) {
      try {
        await createStreamUser({
          userId: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
        });
        streamChatEnabled = true;
      } catch (streamError) {
        console.error("[Stream Chat] User creation failed:", streamError);
      }
    }

    const session = await lucia.createSession(userId, {});
    const cookieStore = await cookies();
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return { streamChatEnabled };
  } catch (error) {
    console.error("Development user creation error:", error);
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }
    throw error;
  }
}

async function createProdUser(options: {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  verificationToken: string;
}): Promise<void> {
  if (!isStreamConfigured() && isProduction) {
    throw new Error("Stream Chat is required in production but not configured");
  }

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        id: options.userId,
        username: options.username,
        displayName: options.username,
        email: options.email,
        passwordHash: options.passwordHash,
        emailVerified: false,
      },
    });

    await tx.emailVerificationToken.create({
      data: {
        token: options.verificationToken,
        userId: options.userId,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });

    if (isStreamConfigured()) {
      try {
        await createStreamUser({
          userId: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
        });
      } catch (streamError) {
        console.error("[Stream Chat] User creation failed:", streamError);
        throw streamError;
      }
    }
  });
}

async function validateSignUpInput(credentials: SignUpValues): Promise<
  | { success: false; error: string }
  | {
      success: true;
      data: { username: string; email: string; password: string };
    }
> {
  if (!credentials) {
    return { success: false, error: "No credentials provided" };
  }

  const validationResult = signUpSchema.safeParse(credentials);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return {
      success: false,
      error: firstError?.message || "Invalid credentials",
    };
  }

  const { username, email, password } = validationResult.data;
  if (!(username && email && password)) {
    return { success: false, error: "All fields are required" };
  }

  const emailValidation = await isEmailValid(email);
  if (!emailValidation.isValid) {
    return {
      success: false,
      error: emailValidation.error || EMAIL_ERRORS.VALIDATION_FAILED,
    };
  }

  return { success: true, data: { username, email, password } };
}

async function checkUserExistence(
  username: string,
  email: string
): Promise<{ success: false; error: string } | { success: true }> {
  const existingUsername = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });

  if (existingUsername) {
    return { success: false, error: USERNAME_ERRORS.taken };
  }

  const existingEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existingEmail) {
    return { success: false, error: EMAIL_ERRORS.ALREADY_EXISTS };
  }

  return { success: true };
}

async function handleDevelopmentSignup(
  userId: string,
  username: string,
  email: string,
  passwordHash: string
): Promise<SignUpResponse> {
  try {
    const { streamChatEnabled } = await createDevUser(
      userId,
      username,
      email,
      passwordHash
    );
    return {
      success: true,
      skipVerification: true,
      message: `Development mode: Email verification skipped. ${
        streamChatEnabled
          ? "Stream Chat enabled successfully."
          : "Stream Chat is not configured - messaging features will be disabled."
      }`,
    };
  } catch (error) {
    console.error("Development signup error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create account in development mode",
    };
  }
}

function createVerificationToken(userId: string, email: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error(SYSTEM_ERRORS.jwtSecret);
  }

  const tokenPayload = { userId, email, timestamp: Date.now() };
  return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

async function handleProductionSignup(
  userId: string,
  username: string,
  email: string,
  passwordHash: string
): Promise<SignUpResponse> {
  try {
    const verificationToken = createVerificationToken(userId, email);

    await createProdUser({
      userId,
      username,
      email,
      passwordHash,
      verificationToken,
    });

    const emailResult = await sendVerificationEmail(email, verificationToken);
    if (!emailResult.success) {
      await prisma.user.delete({ where: { id: userId } });
      return {
        success: false,
        error: emailResult.error || "Failed to send verification email",
      };
    }

    return {
      success: true,
      skipVerification: false,
      message: isStreamConfigured()
        ? undefined
        : "Stream Chat is not configured - messaging features will be disabled.",
    };
  } catch (error) {
    console.error("Production signup error:", error);
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }
    return { success: false, error: "Failed to create account" };
  }
}

async function prepareUserCredentials(
  password: string
): Promise<{ passwordHash: string; userId: string }> {
  const passwordHash = await hash(password);
  const userId = generateIdFromEntropySize(10);

  if (!userId) {
    throw new Error(SYSTEM_ERRORS.userId);
  }

  return { passwordHash, userId };
}

export async function signUp(
  credentials: SignUpValues
): Promise<SignUpResponse> {
  try {
    const validation = await validateSignUpInput(credentials);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { username, email, password } = validation.data;

    const existenceCheck = await checkUserExistence(username, email);
    if (!existenceCheck.success) {
      return { success: false, error: existenceCheck.error };
    }

    const { passwordHash, userId } = await prepareUserCredentials(password);

    if (isDevelopmentMode() && !isEmailServiceConfigured()) {
      return handleDevelopmentSignup(userId, username, email, passwordHash);
    }

    return handleProductionSignup(userId, username, email, passwordHash);
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

export { resendVerificationEmail };
