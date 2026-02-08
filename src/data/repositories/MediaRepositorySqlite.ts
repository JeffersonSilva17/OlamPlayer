import type { MediaItem, MediaType } from "../../models/media";
import type { MediaRepository } from "../../domain/contracts";
import { getDb } from "../sqlite/db";
import { getResultRows } from "../sqlite/queryResult";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export class MediaRepositorySqlite implements MediaRepository {
  async upsertMedia(items: MediaItem[]): Promise<void> {
    if (items.length === 0) return;
    const db = await getDb();
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx.executeAsync(
          `INSERT INTO media_items (
            id, uri, display_name, display_name_norm, mime_type, media_type, duration_ms,
            size_bytes, date_added, last_played, play_count, is_available, source_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(uri) DO UPDATE SET
            display_name = excluded.display_name,
            display_name_norm = excluded.display_name_norm,
            mime_type = excluded.mime_type,
            media_type = excluded.media_type,
            duration_ms = COALESCE(excluded.duration_ms, media_items.duration_ms),
            size_bytes = COALESCE(excluded.size_bytes, media_items.size_bytes),
            is_available = excluded.is_available,
            source_id = excluded.source_id`,
          [
            item.id,
            item.uri,
            item.displayName,
            normalizeSearchText(item.displayName),
            item.mimeType ?? null,
            item.mediaType,
            item.durationMs ?? null,
            item.sizeBytes ?? null,
            item.dateAdded,
            item.lastPlayed ?? null,
            item.playCount,
            item.isAvailable ? 1 : 0,
            item.sourceId ?? null,
          ],
        );
      }
    });
  }

  async removeMedia(id: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(`DELETE FROM media_items WHERE id = ?;`, [id]);
  }

  async markUnavailable(id: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `UPDATE media_items SET is_available = 0 WHERE id = ?;`,
      [id],
    );
  }

  async listMedia(params: {
    mediaType: MediaType;
    query?: string;
    sort?: "name" | "dateAdded";
    order?: "asc" | "desc";
  }): Promise<MediaItem[]> {
    const db = await getDb();
    const sort = params.sort ?? "name";
    const order = params.order ?? "asc";
    const query = params.query ? normalizeSearchText(params.query) : undefined;
    const where = query ? "AND display_name_norm LIKE ?" : "";
    const values = query ? [`%${query}%`] : [];
    const orderBy =
      sort === "dateAdded" ? "date_added" : "display_name_norm COLLATE NOCASE";

    const result = await db.executeAsync<MediaItem>(
      `SELECT
        id,
        uri,
        display_name as displayName,
        mime_type as mimeType,
        media_type as mediaType,
        duration_ms as durationMs,
        size_bytes as sizeBytes,
        date_added as dateAdded,
        last_played as lastPlayed,
        play_count as playCount,
        is_available as isAvailable,
        source_id as sourceId
      FROM media_items
      WHERE media_type = ? ${where}
      ORDER BY ${orderBy} ${order.toUpperCase()};`,
      [params.mediaType, ...values],
    );

    const rows = getResultRows(result);
    return rows.map((row) => ({
      ...row,
      isAvailable: Boolean(row.isAvailable),
    }));
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    const db = await getDb();
    const result = await db.executeAsync<MediaItem>(
      `SELECT
        id,
        uri,
        display_name as displayName,
        mime_type as mimeType,
        media_type as mediaType,
        duration_ms as durationMs,
        size_bytes as sizeBytes,
        date_added as dateAdded,
        last_played as lastPlayed,
        play_count as playCount,
        is_available as isAvailable,
        source_id as sourceId
      FROM media_items
      WHERE id = ?;`,
      [id],
    );
    const rows = getResultRows(result);
    if (rows.length === 0) return null;
    const row = rows[0];
    return { ...row, isAvailable: Boolean(row.isAvailable) };
  }

  async listAllUris(): Promise<string[]> {
    const db = await getDb();
    const result = await db.executeAsync<{ uri: string }>(
      `SELECT uri FROM media_items;`,
    );
    return getResultRows(result).map((row) => row.uri);
  }

  async updatePlaybackStats(id: string, timestamp: number): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `UPDATE media_items
       SET last_played = ?, play_count = play_count + 1
       WHERE id = ?;`,
      [timestamp, id],
    );
  }
}
