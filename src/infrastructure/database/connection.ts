import mongoose from "mongoose";
import { env } from "@/shared/env";
import { logger } from "@/shared/logger";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongodbUri, {
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 8_000
    });
  }

  const connection = await connectionPromise.catch((error) => {
    connectionPromise = null;
    throw error;
  });
  logger.info({ database: mongoose.connection.name }, "MongoDB connected");
  return connection;
}
