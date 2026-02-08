import type { MediaRepository } from "./contracts";

export async function incrementPlaybackStats(
  repo: MediaRepository,
  mediaId: string,
): Promise<void> {
  if ("updatePlaybackStats" in repo) {
    const updater = repo as MediaRepository & {
      updatePlaybackStats: (id: string, timestamp: number) => Promise<void>;
    };
    await updater.updatePlaybackStats(mediaId, Date.now());
    return;
  }
  const item = await repo.getMediaById(mediaId);
  if (!item) return;
  await repo.upsertMedia([
    {
      ...item,
      lastPlayed: Date.now(),
      playCount: (item.playCount ?? 0) + 1,
    },
  ]);
}

export async function updateMediaDuration(
  repo: MediaRepository,
  mediaId: string,
  durationMs: number,
): Promise<void> {
  if (!durationMs || durationMs <= 0) return;
  const item = await repo.getMediaById(mediaId);
  if (!item) return;
  if (item.durationMs && Math.abs(item.durationMs - durationMs) < 1000) return;
  await repo.upsertMedia([
    {
      ...item,
      durationMs,
    },
  ]);
}
