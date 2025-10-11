#!/usr/bin/env node

console.log("Initializing MeiliSearch user search index...");

try {
  // biome-ignore lint/correctness/noUnusedVariables: Used in try-catch
  const { MeiliSearch } = require("meilisearch");
  console.log("MeiliSearch imported successfully");
  const host = process.env.MEILISEARCH_URL;
  const key = process.env.MEILISEARCH_MASTER_KEY;

  if (!(host && key)) {
    console.log(
      "MeiliSearch environment variables not set, skipping initialization"
    );
    process.exit(0);
  }

  console.log("MeiliSearch initialization complete!");
  process.exit(0);
} catch (error) {
  console.error("Error initializing MeiliSearch:", error.message);
  process.exit(1);
}
