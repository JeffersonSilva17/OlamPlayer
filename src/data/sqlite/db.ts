import { NitroSQLite } from "react-native-nitro-sqlite";
import type { NitroSQLiteConnection } from "react-native-nitro-sqlite";
import { runMigrations } from "./migrations";

let connection: NitroSQLiteConnection | null = null;
let initialized = false;

export async function getDb(): Promise<NitroSQLiteConnection> {
  if (!connection) {
    connection = NitroSQLite.open({ name: "olamplayer.db" });
  }
  if (!initialized) {
    await runMigrations(connection);
    initialized = true;
  }
  return connection;
}
