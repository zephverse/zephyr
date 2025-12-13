import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { keys } from "../keys";
import { PrismaClient } from "../prisma/generated/prisma/client";

const adapter = new PrismaPg(
  new pg.Pool({
    connectionString: keys.DATABASE_URL,
  })
);

const prismaClientSingleton = () => new PrismaClient({ adapter });

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (keys.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
