import { initTRPC } from "@trpc/server";

// TODO: Import auth context once Better Auth is configured
// import { auth } from "@zephyr/auth";

const t = initTRPC.context().create();

export const router = t.router;
export const procedure = t.procedure;
