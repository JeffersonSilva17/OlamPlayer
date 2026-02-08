import type { NitroSQLiteConnection } from "react-native-nitro-sqlite";
import { getResultRows } from "./queryResult";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function runMigrations(db: NitroSQLiteConnection): Promise<void> {
  await db.executeAsync("PRAGMA foreign_keys = ON;");

  await db.executeAsync(
    `CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      uri TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      display_name_norm TEXT,
      mime_type TEXT,
      media_type TEXT NOT NULL,
      duration_ms INTEGER,
      size_bytes INTEGER,
      date_added INTEGER NOT NULL,
      last_played INTEGER,
      play_count INTEGER NOT NULL,
      is_available INTEGER NOT NULL,
      source_id TEXT
    );`,
  );

  const info = await db.executeAsync<{ name: string }>(
    `PRAGMA table_info(media_items);`,
  );
  const columns = getResultRows(info).map((col) => col.name);
  if (!columns.includes("display_name_norm")) {
    await db.executeAsync(`ALTER TABLE media_items ADD COLUMN display_name_norm TEXT;`);
  }

  const rows = await db.executeAsync<{ id: string; displayName: string }>(
    `SELECT id, display_name as displayName FROM media_items;`,
  );
  const items = getResultRows(rows);
  if (items.length > 0) {
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx.executeAsync(
          `UPDATE media_items SET display_name_norm = ? WHERE id = ?;`,
          [normalizeSearchText(item.displayName), item.id],
        );
      }
    });
  }

  await db.executeAsync(
    `CREATE TABLE IF NOT EXISTS media_sources (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      uri TEXT UNIQUE NOT NULL,
      display_name TEXT,
      date_added INTEGER NOT NULL
    );`,
  );

  await db.executeAsync(
    `CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      media_type TEXT NOT NULL,
      date_created INTEGER NOT NULL,
      date_updated INTEGER NOT NULL
    );`,
  );

  await db.executeAsync(
    `CREATE TABLE IF NOT EXISTS playlist_items (
      playlist_id TEXT NOT NULL,
      media_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, media_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE
    );`,
  );

  await db.executeAsync(
    `CREATE TABLE IF NOT EXISTS ignored_folders (
      pattern TEXT PRIMARY KEY
    );`,
  );

  await db.executeAsync(
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
  );
}
