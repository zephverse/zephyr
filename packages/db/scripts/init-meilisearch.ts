import { userSearchIndex } from "../src/meilisearch";
import { default as prisma } from "../src/prisma";

async function initializeMeiliSearch() {
  console.log("Initializing MeiliSearch for user search...");

  try {
    await userSearchIndex.initialize();
    console.log("MeiliSearch users index initialized");
    console.log("Fetching users from database...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        displayUsername: true,
        email: true,
        role: true,
        aura: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        bio: true,
        avatarUrl: true,
      },
    });

    console.log(`Found ${users.length} users to index`);

    if (users.length === 0) {
      console.log("No users to index");
      return;
    }

    const searchDocuments = users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      displayUsername: user.displayUsername,
      email: user.email,
      role: user.role,
      aura: user.aura,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    }));

    console.log("Clearing existing search index...");
    await userSearchIndex.deleteAllUsers();

    console.log("Indexing users...");
    await userSearchIndex.indexUsers(searchDocuments);

    console.log(`Successfully indexed ${users.length} users in MeiliSearch`);

    console.log("Testing search functionality...");
    const testResults = await userSearchIndex.search("", { limit: 5 });
    console.log(`Search test: Found ${testResults.total} total users`);
  } catch (error) {
    console.error("Error initializing MeiliSearch:", error);
    process.exit(1);
  }
}

initializeMeiliSearch()
  .then(() => {
    console.log("MeiliSearch initialization complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Initialization failed:", error);
    process.exit(1);
  });
