// TODO: Import auth from @zephyr/auth once Better Auth is configured
// import { auth } from "@zephyr/auth";

// Temporary placeholder - will be replaced with actual Better Auth instance
const auth = {
  GET: () => new Response("Auth endpoint not yet configured", { status: 501 }),
  POST: () => new Response("Auth endpoint not yet configured", { status: 501 }),
};

export const { GET, POST } = auth;
