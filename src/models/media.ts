export type MediaType = "audio" | "video";

export interface MediaItem {
  id: string;
  uri: string;
  displayName: string;
  mimeType?: string;
  mediaType: MediaType;
  durationMs?: number;
  sizeBytes?: number;
  dateAdded: number;
  lastPlayed?: number;
  playCount: number;
  isAvailable: boolean;
  sourceId?: string;
}

export type MediaSourceType = "file" | "folder";

export interface MediaSource {
  id: string;
  sourceType: MediaSourceType;
  uri: string;
  displayName?: string;
  dateAdded: number;
}
