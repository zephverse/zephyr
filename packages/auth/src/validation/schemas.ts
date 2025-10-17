import { z } from "zod";
import {
  commonsequencesRegex,
  threerepeatRegex,
  whitespaceRegex,
} from "./constants";

const requiredUsername = z
  .string()
  .trim()
  .min(1, "Username is required, pick something cool!");
const requiredEmail = z
  .string()
  .trim()
  .min(1, "Email is required, we need to reach you!");
const requiredPassword = z
  .string()
  .trim()
  .min(1, "Password is required, keep it safe!");
const requiredString = z.string().trim().min(1, "This field is required!");

export const signUpSchema = z.object({
  email: requiredEmail.email("Please enter a valid email address"),
  username: requiredUsername.regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores (no weird symbols pls)"
  ),
  password: requiredPassword
    .min(8, "Password needs at least 8 characters, keep it 100")
    .regex(/[A-Z]/, "Need at least one uppercase letter (be fancy!)")
    .regex(/[a-z]/, "Need at least one lowercase letter (keep it real!)")
    .regex(/[0-9]/, "Need at least one number (math time!)")
    .regex(/[@$!%*?&#]/, "Need at least one special character (be spicy!)")
    .refine(
      (password) => !threerepeatRegex.test(password),
      "No spamming the same letter 3+ times (that's not cute anymore)"
    )
    .refine(
      (password) => !commonsequencesRegex.test(password),
      "ABC or 123? Nah, be more creative than that!"
    )
    .refine((password) => {
      const commonWords = ["password", "admin", "user", "login"];
      return !commonWords.some((word) => password.toLowerCase().includes(word));
    }, "'password123' is so last season, pick something better!"),
});

export const loginSchema = z.object({
  username: requiredUsername,
  password: requiredPassword,
});

export const createPostSchema = z.object({
  content: requiredString,
  mediaIds: z.array(z.string()).max(5, "Cannot have more than 5 attachments"),
  tags: z.array(z.string()),
  mentions: z.array(z.string()).default([]),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z
    .string()
    .max(2000, "Bio must be at most 2000 characters")
    .refine(
      (text) =>
        text.trim().split(whitespaceRegex).filter(Boolean).length <= 400,
      "Bio must not exceed 400 words"
    ),
});

export const createCommentSchema = z.object({
  content: requiredString,
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;
export type CreateCommentValues = z.infer<typeof createCommentSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
