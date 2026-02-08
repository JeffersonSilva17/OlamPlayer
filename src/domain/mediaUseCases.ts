import { v4 as uuidv4 } from "uuid";
import type { MediaItem, MediaType } from "../models/media";
import type { MediaRepository, PickedFile } from "./contracts";

const AUDIO_EXTENSIONS = new Set([".mp3", ".aac", ".wav", ".flac", ".m4a"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mkv", ".mov", ".avi", ".webm", ".m4v"]);

function getFileExtension(fileName?: string): string | null {
  if (!fileName) return null;
  const lower = fileName.toLowerCase();
  const index = lower.lastIndexOf(".");
  if (index <= 0) return null;
  return lower.slice(index);
}

export function isSupportedMediaFile(file: PickedFile): boolean {
  if (file.mimeType) {
    if (file.mimeType.startsWith("video/")) return true;
    if (file.mimeType.startsWith("audio/")) return true;
  }
  const ext = getFileExtension(file.displayName);
  if (!ext) return false;
  return AUDIO_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
}

function inferMediaType(
  mimeType?: string,
  fallback: MediaType = "audio",
  fileName?: string,
): MediaType {
  if (mimeType) {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
  }
  const ext = getFileExtension(fileName);
  if (ext) {
    if (VIDEO_EXTENSIONS.has(ext)) return "video";
    if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  }
  return fallback;
}

export function buildMediaItemsFromPickedFiles(
  files: PickedFile[],
  fallbackType: MediaType,
  sourceId?: string,
): MediaItem[] {
  const now = Date.now();
  return files.map((file) => ({
    id: uuidv4(),
    uri: file.uri,
    displayName: file.displayName ?? "Sem nome",
    mimeType: file.mimeType,
    mediaType: inferMediaType(file.mimeType, fallbackType, file.displayName),
    durationMs: undefined,
    sizeBytes: file.sizeBytes,
    dateAdded: now,
    lastPlayed: undefined,
    playCount: 0,
    isAvailable: true,
    sourceId,
  }));
}

export async function addMediaItems(
  repo: MediaRepository,
  items: MediaItem[],
): Promise<void> {
  await repo.upsertMedia(items);
}
