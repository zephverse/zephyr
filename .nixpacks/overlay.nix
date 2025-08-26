self: super: {
  # Ensure only one pnpm derivation is present to avoid pnpm/pnpx collisions
  pnpm-9_x = super.pnpm;
}

self: super: {
  pnpm-9_x = super.pnpm;
}
