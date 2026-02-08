import type { MediaItem } from "../models/media";

export type LibraryStackParamList = {
  Library: undefined;
  Player: { item: MediaItem; queue?: MediaItem[]; queueLabel?: string };
};

export type PlaylistsStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { playlistId: string; playlistName: string; mediaType: "audio" | "video" };
};

export type RootTabParamList = {
  Biblioteca: undefined;
  Adicionar: undefined;
  Playlists: undefined;
  Configuracoes: undefined;
};
