import type { MediaItem, MediaType } from "../models/media";

export type LibraryStackParamList = {
  Library:
    | undefined
    | {
        mediaType?: MediaType;
        hideTabs?: boolean;
        showAddButton?: boolean;
      };
  Player: { item: MediaItem; queue?: MediaItem[]; queueLabel?: string };
};

export type PlaylistsStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { playlistId: string; playlistName: string; mediaType: "audio" | "video" };
};

export type RootTabParamList = {
  Video: undefined;
  Audio: undefined;
  Playlists: undefined;
  Configuracoes: undefined;
};
