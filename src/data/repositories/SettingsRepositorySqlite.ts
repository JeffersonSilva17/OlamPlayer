import type { SettingsRepository } from "../../domain/contracts";
import { getDb } from "../sqlite/db";
import { getResultRows } from "../sqlite/queryResult";

export class SettingsRepositorySqlite implements SettingsRepository {
  async listIgnoredFolders(): Promise<string[]> {
    const db = await getDb();
    const result = await db.executeAsync<{ pattern: string }>(
      `SELECT pattern FROM ignored_folders ORDER BY pattern ASC;`,
    );
    const rows = getResultRows(result);
    return rows.map((row) => row.pattern);
  }

  async addIgnoredFolder(pattern: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `INSERT OR IGNORE INTO ignored_folders (pattern) VALUES (?);`,
      [pattern.trim()],
    );
  }

  async removeIgnoredFolder(pattern: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(`DELETE FROM ignored_folders WHERE pattern = ?;`, [
      pattern.trim(),
    ]);
  }

  async clearLibrary(): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.executeAsync(`DELETE FROM playlist_items;`);
      await tx.executeAsync(`DELETE FROM playlists;`);
      await tx.executeAsync(`DELETE FROM media_items;`);
      await tx.executeAsync(`DELETE FROM media_sources;`);
    });
  }
}
