import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/auth/config";

export const { GET, POST } = toNextJsHandler(auth);
