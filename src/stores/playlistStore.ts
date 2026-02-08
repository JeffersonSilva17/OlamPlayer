import { create } from "zustand";
import type { MediaItem, MediaType } from "../models/media";
import type { Playlist } from "../models/playlist";
import { PlaylistRepositorySqlite } from "../data/repositories/PlaylistRepositorySqlite";

type PlaylistStoreState = {
  playlists: Playlist[];
  items: MediaItem[];
  loading: boolean;
  loadPlaylists: (mediaType?: MediaType) => Promise<void>;
  loadPlaylistItems: (playlistId: string) => Promise<void>;
  createPlaylist: (name: string, mediaType: MediaType) => Promise<void>;
  createPlaylistWithItems: (
    name: string,
    mediaType: MediaType,
    mediaIds: string[],
  ) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, mediaId: string) => Promise<void>;
  addItemsToPlaylist: (playlistId: string, mediaIds: string[]) => Promise<void>;
  removeFromPlaylist: (playlistId: string, mediaId: string) => Promise<void>;
  reorderPlaylistItems: (playlistId: string, orderedMediaIds: string[]) => Promise<void>;
};

const repository = new PlaylistRepositorySqlite();

export const usePlaylistStore = create<PlaylistStoreState>((set, get) => ({
  playlists: [],
  items: [],
  loading: false,
  async loadPlaylists(mediaType) {
    set({ loading: true });
    try {
      const playlists = await repository.listPlaylists();
      set({ playlists });
    } catch (error) {
      console.warn("Falha ao carregar playlists", error);
    } finally {
      set({ loading: false });
    }
  },
  async loadPlaylistItems(playlistId) {
    set({ loading: true });
    try {
      const items = await repository.listPlaylistItems(playlistId);
      set({ items });
    } catch (error) {
      console.warn("Falha ao carregar itens da playlist", error);
    } finally {
      set({ loading: false });
    }
  },
  async createPlaylist(name, mediaType) {
    try {
      await repository.createPlaylist({ name, mediaType });
      await get().loadPlaylists();
    } catch (error) {
      console.warn("Falha ao criar playlist", error);
    }
  },
  async createPlaylistWithItems(name, mediaType, mediaIds) {
    try {
      const playlist = await repository.createPlaylist({ name, mediaType });
      for (const mediaId of mediaIds) {
        await repository.addToPlaylist(playlist.id, mediaId);
      }
      await get().loadPlaylists();
    } catch (error) {
      console.warn("Falha ao criar playlist com itens", error);
    }
  },
  async deletePlaylist(id) {
    try {
      await repository.deletePlaylist(id);
      await get().loadPlaylists();
    } catch (error) {
      console.warn("Falha ao excluir playlist", error);
    }
  },
  async addToPlaylist(playlistId, mediaId) {
    try {
      await repository.addToPlaylist(playlistId, mediaId);
      await get().loadPlaylistItems(playlistId);
    } catch (error) {
      console.warn("Falha ao adicionar item na playlist", error);
    }
  },
  async addItemsToPlaylist(playlistId, mediaIds) {
    try {
      for (const mediaId of mediaIds) {
        await repository.addToPlaylist(playlistId, mediaId);
      }
    } catch (error) {
      console.warn("Falha ao adicionar itens na playlist", error);
    }
  },
  async removeFromPlaylist(playlistId, mediaId) {
    try {
      await repository.removeFromPlaylist(playlistId, mediaId);
      await get().loadPlaylistItems(playlistId);
    } catch (error) {
      console.warn("Falha ao remover item da playlist", error);
    }
  },
  async reorderPlaylistItems(playlistId, orderedMediaIds) {
    try {
      await repository.reorderPlaylistItems(playlistId, orderedMediaIds);
      await get().loadPlaylistItems(playlistId);
    } catch (error) {
      console.warn("Falha ao reordenar playlist", error);
    }
  },
}));
