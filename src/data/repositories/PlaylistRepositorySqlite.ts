import type { PlaylistRepository } from "../../domain/contracts";
import type { MediaItem, MediaType } from "../../models/media";
import type { Playlist } from "../../models/playlist";
import { getDb } from "../sqlite/db";
import { getResultRows } from "../sqlite/queryResult";

export class PlaylistRepositorySqlite implements PlaylistRepository {
  async createPlaylist(p: { name: string; mediaType: MediaType }): Promise<Playlist> {
    const db = await getDb();
    const now = Date.now();
    const id = p.name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + now;
    const playlist: Playlist = {
      id,
      name: p.name.trim(),
      mediaType: p.mediaType,
      dateCreated: now,
      dateUpdated: now,
    };
    await db.executeAsync(
      `INSERT INTO playlists (id, name, media_type, date_created, date_updated)
       VALUES (?, ?, ?, ?, ?);`,
      [playlist.id, playlist.name, playlist.mediaType, playlist.dateCreated, playlist.dateUpdated],
    );
    return playlist;
  }

  async renamePlaylist(id: string, name: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `UPDATE playlists SET name = ?, date_updated = ? WHERE id = ?;`,
      [name.trim(), Date.now(), id],
    );
  }

  async deletePlaylist(id: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(`DELETE FROM playlists WHERE id = ?;`, [id]);
  }

  async addToPlaylist(playlistId: string, mediaId: string): Promise<void> {
    const db = await getDb();
    const result = await db.executeAsync<{ position: number }>(
      `SELECT COALESCE(MAX(position), 0) as position
       FROM playlist_items WHERE playlist_id = ?;`,
      [playlistId],
    );
    const rows = getResultRows(result);
    const nextPosition = (rows[0]?.position ?? 0) + 1;
    await db.executeAsync(
      `INSERT OR IGNORE INTO playlist_items (playlist_id, media_id, position)
       VALUES (?, ?, ?);`,
      [playlistId, mediaId, nextPosition],
    );
    await db.executeAsync(`UPDATE playlists SET date_updated = ? WHERE id = ?;`, [
      Date.now(),
      playlistId,
    ]);
  }

  async removeFromPlaylist(playlistId: string, mediaId: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `DELETE FROM playlist_items WHERE playlist_id = ? AND media_id = ?;`,
      [playlistId, mediaId],
    );
    await db.executeAsync(`UPDATE playlists SET date_updated = ? WHERE id = ?;`, [
      Date.now(),
      playlistId,
    ]);
  }

  async reorderPlaylistItems(
    playlistId: string,
    orderedMediaIds: string[],
  ): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      let position = 1;
      for (const mediaId of orderedMediaIds) {
        await tx.executeAsync(
          `UPDATE playlist_items SET position = ? WHERE playlist_id = ? AND media_id = ?;`,
          [position, playlistId, mediaId],
        );
        position += 1;
      }
    });
    await db.executeAsync(`UPDATE playlists SET date_updated = ? WHERE id = ?;`, [
      Date.now(),
      playlistId,
    ]);
  }

  async listPlaylists(mediaType?: MediaType): Promise<Playlist[]> {
    const db = await getDb();
    const where = mediaType ? "WHERE media_type = ?" : "";
    const params = mediaType ? [mediaType] : [];
    const result = await db.executeAsync<Playlist>(
      `SELECT
        id,
        name,
        media_type as mediaType,
        date_created as dateCreated,
        date_updated as dateUpdated
      FROM playlists
      ${where}
      ORDER BY date_updated DESC;`,
      params,
    );
    return getResultRows(result);
  }

  async listPlaylistItems(playlistId: string): Promise<MediaItem[]> {
    const db = await getDb();
    const result = await db.executeAsync<MediaItem>(
      `SELECT
        m.id,
        m.uri,
        m.display_name as displayName,
        m.mime_type as mimeType,
        m.media_type as mediaType,
        m.duration_ms as durationMs,
        m.size_bytes as sizeBytes,
        m.date_added as dateAdded,
        m.last_played as lastPlayed,
        m.play_count as playCount,
        m.is_available as isAvailable,
        m.source_id as sourceId
      FROM playlist_items pi
      JOIN media_items m ON m.id = pi.media_id
      WHERE pi.playlist_id = ?
      ORDER BY pi.position ASC;`,
      [playlistId],
    );
    const rows = getResultRows(result);
    return rows.map((row) => ({
      ...row,
      isAvailable: Boolean(row.isAvailable),
    }));
  }
}
