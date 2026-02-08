import type { MediaItem, MediaSource, MediaSourceType, MediaType } from "../models/media";
import type { Playlist } from "../models/playlist";

export interface MediaRepository {
  upsertMedia(items: MediaItem[]): Promise<void>;
  removeMedia(id: string): Promise<void>;
  markUnavailable(id: string): Promise<void>;
  listMedia(params: {
    mediaType: MediaType;
    query?: string;
    sort?: "name" | "dateAdded";
    order?: "asc" | "desc";
  }): Promise<MediaItem[]>;
  getMediaById(id: string): Promise<MediaItem | null>;
}

export interface PlayerState {
  currentUri?: string;
  isPlaying: boolean;
  positionMs: number;
  durationMs?: number;
  speed: number;
  mediaType?: MediaType;
}

export interface PlayerController {
  load(uri: string, mediaType: MediaType): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  setSpeed(speed: number): Promise<void>;
  getState(): Promise<PlayerState>;
  onStateChanged(listener: (s: PlayerState) => void): () => void;
}

export interface PickedFile {
  uri: string;
  displayName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface PickedFolder {
  uri: string;
  displayName?: string;
}

export interface FilePickerAdapter {
  pickFiles(accept: ("audio" | "video")[]): Promise<PickedFile[]>;
  pickFolder?(): Promise<PickedFolder>;
}

export interface AndroidSafService {
  takePersistablePermission(uri: string): Promise<void>;
  copyToCache?(uri: string, fileName?: string): Promise<string>;
}

export interface FolderIndexResult {
  filesFound: number;
  filesAdded: number;
}

export interface FolderIndexer {
  indexFolderTree(
    treeUri: string,
    options?: { ignorePatterns?: string[] },
  ): Promise<FolderIndexResult>;
}

export interface ShareAdapter {
  shareFile(params: { uri: string; mimeType?: string; title?: string }): Promise<void>;
}

export interface PlaylistRepository {
  createPlaylist(p: { name: string; mediaType: MediaType }): Promise<Playlist>;
  renamePlaylist(id: string, name: string): Promise<void>;
  deletePlaylist(id: string): Promise<void>;
  addToPlaylist(playlistId: string, mediaId: string): Promise<void>;
  removeFromPlaylist(playlistId: string, mediaId: string): Promise<void>;
  reorderPlaylistItems(playlistId: string, orderedMediaIds: string[]): Promise<void>;
  listPlaylists(mediaType?: MediaType): Promise<Playlist[]>;
  listPlaylistItems(playlistId: string): Promise<MediaItem[]>;
}

export interface MediaSourceRepository {
  upsertSource(source: MediaSource): Promise<void>;
  listSources(type?: MediaSourceType): Promise<MediaSource[]>;
}

export interface SettingsRepository {
  listIgnoredFolders(): Promise<string[]>;
  addIgnoredFolder(pattern: string): Promise<void>;
  removeIgnoredFolder(pattern: string): Promise<void>;
  clearLibrary(): Promise<void>;
}
