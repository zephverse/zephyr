import { MeiliSearch } from "meilisearch";
import { keys } from "../keys";

let meilisearch: MeiliSearch | null = null;

function getMeiliSearchClient(): MeiliSearch {
  if (!meilisearch) {
    try {
      meilisearch = new MeiliSearch({
        host: keys.MEILISEARCH_URL,
        apiKey: keys.MEILISEARCH_MASTER_KEY,
      });
    } catch (error) {
      console.error("Failed to initialize MeiliSearch client:", error);
      throw error;
    }
  }
  return meilisearch;
}

export { getMeiliSearchClient as meilisearch };

export type UserSearchDocument = {
  id: string;
  username: string;
  displayName: string;
  displayUsername: string | null;
  email: string | null;
  role: string;
  aura: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  bio: string | null;
  avatarUrl: string | null;
};

export const userSearchIndex = {
  name: "users",

  async initialize(): Promise<void> {
    try {
      const client = getMeiliSearchClient();
      const indexes = await client.getIndexes();
      const indexExists = indexes.results.some(
        (index) => index.uid === this.name
      );

      if (!indexExists) {
        await client.createIndex(this.name, {
          primaryKey: "id",
        });

        const index = client.index(this.name);

        await index.updateSearchableAttributes([
          "username",
          "displayName",
          "displayUsername",
          "email",
        ]);

        await index.updateFilterableAttributes([
          "role",
          "emailVerified",
          "aura",
          "createdAt",
        ]);

        await index.updateSortableAttributes([
          "username",
          "displayName",
          "aura",
          "createdAt",
          "updatedAt",
        ]);

        await index.updateRankingRules([
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ]);

        console.log("MeiliSearch users index initialized");
      }
    } catch (error) {
      console.error("Error initializing MeiliSearch users index:", error);
      throw error;
    }
  },

  async indexUsers(users: UserSearchDocument[]): Promise<void> {
    try {
      const client = getMeiliSearchClient();
      const index = client.index(this.name);
      await index.addDocuments(users);
    } catch (error) {
      console.error("Error indexing users:", error);
      throw error;
    }
  },

  async updateUser(user: UserSearchDocument): Promise<void> {
    try {
      const client = getMeiliSearchClient();
      const index = client.index(this.name);
      await index.updateDocuments([user]);
    } catch (error) {
      console.error("Error updating user in search index:", error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      const client = getMeiliSearchClient();
      const index = client.index(this.name);
      await index.deleteDocument(userId);
    } catch (error) {
      console.error("Error deleting user from search index:", error);
      throw error;
    }
  },

  async search(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      filter?: string[];
      sort?: string[];
      attributesToRetrieve?: string[];
    } = {}
  ): Promise<{
    hits: UserSearchDocument[];
    total: number;
    offset: number;
    limit: number;
    estimatedTotalHits: number;
  }> {
    try {
      const client = getMeiliSearchClient();
      const index = client.index(this.name);

      const searchParams = {
        q: query,
        limit: options.limit || 20,
        offset: options.offset || 0,
        filter: options.filter || [],
        sort: options.sort || ["createdAt:desc"],
        attributesToRetrieve: options.attributesToRetrieve || [
          "id",
          "username",
          "displayName",
          "displayUsername",
          "email",
          "role",
          "aura",
          "emailVerified",
          "createdAt",
          "updatedAt",
          "bio",
          "avatarUrl",
        ],
      };

      const result = await index.search(query, searchParams);

      return {
        hits: result.hits as UserSearchDocument[],
        total: result.estimatedTotalHits || 0,
        offset: result.offset || 0,
        limit: result.limit || 20,
        estimatedTotalHits: result.estimatedTotalHits || 0,
      };
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  async getUser(userId: string): Promise<UserSearchDocument | null> {
    try {
      const client = getMeiliSearchClient();
      const index = client.index(this.name);
      const result = await index.getDocument(userId);
      return result as UserSearchDocument;
    } catch (error) {
      console.error("Error getting user from search index:", error);
      return null;
    }
  },

  async deleteAllUsers(): Promise<void> {
    try {
      const client = getMeiliSearchClient();
      const index = client.index(this.name);
      await index.deleteAllDocuments();
    } catch (error) {
      console.error("Error deleting all users from search index:", error);
      throw error;
    }
  },
};
