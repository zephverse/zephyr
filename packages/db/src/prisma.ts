import { PrismaClient } from "@prisma/client";
import { keys } from "../keys";

const prismaClientSingleton = () => new PrismaClient();

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (keys.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
