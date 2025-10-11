import nextra from "nextra";

const withNextra = nextra({
  // ... Add Nextra-specific options here
});

export default withNextra({
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@zephyr/ui", "@zephyr/config"],
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.js",
    },
  },
});
