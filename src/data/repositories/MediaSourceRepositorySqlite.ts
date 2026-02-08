import type { MediaSourceRepository } from "../../domain/contracts";
import type { MediaSource, MediaSourceType } from "../../models/media";
import { getDb } from "../sqlite/db";
import { getResultRows } from "../sqlite/queryResult";

export class MediaSourceRepositorySqlite implements MediaSourceRepository {
  async upsertSource(source: MediaSource): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `INSERT INTO media_sources (id, source_type, uri, display_name, date_added)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(uri) DO UPDATE SET
         source_type = excluded.source_type,
         display_name = excluded.display_name;`,
      [
        source.id,
        source.sourceType,
        source.uri,
        source.displayName ?? null,
        source.dateAdded,
      ],
    );
  }

  async listSources(type?: MediaSourceType): Promise<MediaSource[]> {
    const db = await getDb();
    const where = type ? "WHERE source_type = ?" : "";
    const params = type ? [type] : [];
    const result = await db.executeAsync<MediaSource>(
      `SELECT
        id,
        source_type as sourceType,
        uri,
        display_name as displayName,
        date_added as dateAdded
      FROM media_sources
      ${where}
      ORDER BY date_added DESC;`,
      params,
    );
    return getResultRows(result);
  }
}
