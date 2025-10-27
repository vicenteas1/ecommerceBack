import mongoose from "mongoose";
import { Logger } from "./logger.js";
import { environment } from "./environment.js";

export async function connectDB(): Promise<void> {
  try {
    const { uri, port } = environment.mongodb[0];
    const { name } = environment.databases[0];

    const connectionString = `${uri}:${port}/${name}`;

    const conn = await mongoose.connect(connectionString);

    Logger.info(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    Logger.error(`Imposible conectarse a Mongo DB: ${error}`);
    process.exit(1);
  }
}
