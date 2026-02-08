import { Alert, Platform } from "react-native";
import { isErrorWithCode, errorCodes } from "@react-native-documents/picker";
import { create } from "zustand";
import type { MediaItem, MediaType } from "../models/media";
import type { PickedFile } from "../domain/contracts";
import { MediaRepositorySqlite } from "../data/repositories/MediaRepositorySqlite";
import { SettingsRepositorySqlite } from "../data/repositories/SettingsRepositorySqlite";
import { MediaSourceRepositorySqlite } from "../data/repositories/MediaSourceRepositorySqlite";
import { DocumentPickerAdapter } from "../infra/filePicker/DocumentPickerAdapter";
import { importToAppSandbox } from "../infra/import/MediaImportService";
import { androidSafService } from "../infra/android/AndroidSafService";
import { scanFolderTree } from "../infra/android/AndroidFolderIndexer";
import {
  buildMediaItemsFromPickedFiles,
  addMediaItems,
  isSupportedMediaFile,
} from "../domain/mediaUseCases";
import { v4 as uuidv4 } from "uuid";

type MediaStoreState = {
  items: Record<MediaType, MediaItem[]>;
  query: string;
  sort: "name" | "dateAdded";
  order: "asc" | "desc";
  loading: boolean;
  indexing: boolean;
  indexStatus?: { filesFound: number; filesAdded: number; filesSkipped?: number };
  ignoredFolders: string[];
  loadMedia: (mediaType: MediaType) => Promise<void>;
  setQuery: (value: string) => void;
  setSort: (sort: "name" | "dateAdded") => void;
  addFiles: (accept: ("audio" | "video")[]) => Promise<number>;
  addExternalFiles: (files: PickedFile[]) => Promise<number>;
  addFolder: () => Promise<void>;
  removeMedia: (id: string, mediaType: MediaType) => Promise<void>;
  reimportMedia: (item: MediaItem) => Promise<void>;
  refreshIgnoredFolders: () => Promise<void>;
  addIgnoredFolder: (pattern: string) => Promise<void>;
  removeIgnoredFolder: (pattern: string) => Promise<void>;
};

const mediaRepository = new MediaRepositorySqlite();
const settingsRepository = new SettingsRepositorySqlite();
const sourceRepository = new MediaSourceRepositorySqlite();
const filePicker = new DocumentPickerAdapter();

type DuplicateDecision = "skip" | "replace" | "cancel";

function askDuplicateDecision(count: number): Promise<DuplicateDecision> {
  return new Promise((resolve) => {
    Alert.alert(
      "Duplicados encontrados",
      `${count} arquivos ja existem na biblioteca. Deseja substituir ou pular?`,
      [
        { text: "Pular", onPress: () => resolve("skip") },
        { text: "Substituir", onPress: () => resolve("replace") },
        { text: "Cancelar", style: "cancel", onPress: () => resolve("cancel") },
      ],
    );
  });
}

export const useMediaStore = create<MediaStoreState>((set, get) => ({
  items: { audio: [], video: [] },
  query: "",
  sort: "name",
  order: "asc",
  loading: false,
  indexing: false,
  ignoredFolders: [],
  async loadMedia(mediaType) {
    set({ loading: true });
    try {
      const items = await mediaRepository.listMedia({
        mediaType,
        query: get().query,
        sort: get().sort,
        order: get().order,
      });
      set((state) => ({
        items: { ...state.items, [mediaType]: items },
      }));
    } catch (error) {
      console.warn("Falha ao carregar midias", error);
    } finally {
      set({ loading: false });
    }
  },
  setQuery(value) {
    set({ query: value });
  },
  setSort(sort) {
    set({
      sort,
      order: sort === "dateAdded" ? "desc" : "asc",
    });
  },
  async addFiles(accept) {
    try {
      const picked = await filePicker.pickFiles(accept);
      if (picked.length === 0) return 0;
      if (Platform.OS === "android") {
        await Promise.all(
          picked.map((file) => androidSafService.takePersistablePermission(file.uri)),
        );
      }
      const imported = await importToAppSandbox(picked);
      const existingUris = await mediaRepository.listAllUris();
      const existingSet = new Set(existingUris);
      const duplicates = imported.filter((file) => existingSet.has(file.uri));
      const newFiles = imported.filter((file) => !existingSet.has(file.uri));

      let filesToAdd = imported;
      if (duplicates.length > 0) {
        const decision = await askDuplicateDecision(duplicates.length);
        if (decision === "cancel") return 0;
        filesToAdd = decision === "skip" ? newFiles : imported;
      }

      const items = buildMediaItemsFromPickedFiles(filesToAdd, "audio");
      await addMediaItems(mediaRepository, items);
      await get().loadMedia("audio");
      await get().loadMedia("video");
      return items.length;
    } catch (error) {
      console.warn("Falha ao adicionar arquivos", error);
      return 0;
    }
  },
  async addExternalFiles(files) {
    try {
      if (!files || files.length === 0) return 0;
      const imported = await importToAppSandbox(files);
      const existingUris = await mediaRepository.listAllUris();
      const existingSet = new Set(existingUris);
      const duplicates = imported.filter((file) => existingSet.has(file.uri));
      const newFiles = imported.filter((file) => !existingSet.has(file.uri));

      let filesToAdd = imported;
      if (duplicates.length > 0) {
        const decision = await askDuplicateDecision(duplicates.length);
        if (decision === "cancel") return 0;
        filesToAdd = decision === "skip" ? newFiles : imported;
      }

      const items = buildMediaItemsFromPickedFiles(filesToAdd, "audio");
      await addMediaItems(mediaRepository, items);
      await get().loadMedia("audio");
      await get().loadMedia("video");
      return items.length;
    } catch (error) {
      console.warn("Falha ao importar arquivo externo", error);
      return 0;
    }
  },
  async addFolder() {
    if (Platform.OS !== "android") return;
    let folder;
    try {
      folder = await filePicker.pickFolder?.();
    } catch (error: any) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      console.warn("Falha ao selecionar pasta", error);
      return;
    }
    if (!folder) return;
    await androidSafService.takePersistablePermission(folder.uri);
    const sourceId = uuidv4();
    await sourceRepository.upsertSource({
      id: sourceId,
      sourceType: "folder",
      uri: folder.uri,
      displayName: folder.displayName,
      dateAdded: Date.now(),
    });
    set({ indexing: true, indexStatus: undefined });
    try {
      const scanned = await scanFolderTree(folder.uri, get().ignoredFolders);
      const supported = scanned.filter(isSupportedMediaFile);
      const unsupportedCount = scanned.length - supported.length;
      const existingUris = await mediaRepository.listAllUris();
      const existingSet = new Set(existingUris);
      const duplicates = supported.filter((file) => existingSet.has(file.uri));
      const newFiles = supported.filter((file) => !existingSet.has(file.uri));

      const applyAdd = async (filesToAdd: PickedFile[], skipped: number) => {
        const mediaItems = buildMediaItemsFromPickedFiles(
          filesToAdd,
          "audio",
          sourceId,
        );
        await addMediaItems(mediaRepository, mediaItems);
        set({
          indexStatus: {
            filesFound: scanned.length,
            filesAdded: mediaItems.length,
            filesSkipped: skipped,
          },
        });
        await get().loadMedia("audio");
        await get().loadMedia("video");
      };

      if (duplicates.length > 0) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            "Duplicados encontrados",
            `${duplicates.length} arquivos ja existem na biblioteca. Deseja substituir ou pular?`,
            [
              {
                text: "Pular",
                onPress: async () => {
                  await applyAdd(newFiles, duplicates.length + unsupportedCount);
                  resolve();
                },
              },
              {
                text: "Substituir",
                onPress: async () => {
                  await applyAdd(supported, unsupportedCount);
                  resolve();
                },
              },
              { text: "Cancelar", style: "cancel", onPress: () => resolve() },
            ],
          );
        });
      } else {
        await applyAdd(supported, unsupportedCount);
      }
    } catch (error) {
      console.warn("Falha ao indexar pasta", error);
    } finally {
      set({ indexing: false });
    }
  },
  async removeMedia(id, mediaType) {
    await mediaRepository.removeMedia(id);
    await get().loadMedia(mediaType);
  },
  async reimportMedia(item) {
    try {
      const picked = await filePicker.pickFiles([item.mediaType]);
      if (picked.length === 0) return;
      const target = picked[0];
      if (Platform.OS === "android") {
        await androidSafService.takePersistablePermission(target.uri);
      }
      const imported = await importToAppSandbox([target]);
      const items = buildMediaItemsFromPickedFiles(
        imported,
        item.mediaType,
        item.sourceId,
      );
      await addMediaItems(mediaRepository, items);
      await mediaRepository.removeMedia(item.id);
      await get().loadMedia("audio");
      await get().loadMedia("video");
    } catch (error) {
      console.warn("Falha ao reimportar midia", error);
    }
  },
  async refreshIgnoredFolders() {
    try {
      const ignored = await settingsRepository.listIgnoredFolders();
      set({ ignoredFolders: ignored });
    } catch (error) {
      console.warn("Falha ao carregar pastas ignoradas", error);
    }
  },
  async addIgnoredFolder(pattern) {
    if (!pattern.trim()) return;
    await settingsRepository.addIgnoredFolder(pattern);
    await get().refreshIgnoredFolders();
  },
  async removeIgnoredFolder(pattern) {
    await settingsRepository.removeIgnoredFolder(pattern);
    await get().refreshIgnoredFolders();
  },
}));
