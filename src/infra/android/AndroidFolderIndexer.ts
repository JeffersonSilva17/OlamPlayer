import { NativeModules, Platform } from "react-native";
import type { FolderIndexer, FolderIndexResult, PickedFile } from "../../domain/contracts";
import type { MediaRepository } from "../../domain/contracts";
import { buildMediaItemsFromPickedFiles, addMediaItems } from "../../domain/mediaUseCases";

type AndroidSafNative = {
  indexFolderTree(uri: string, ignorePatterns?: string[]): Promise<
    {
      uri: string;
      displayName?: string;
      mimeType?: string;
      sizeBytes?: number;
    }[]
  >;
};

const NativeSaf: AndroidSafNative | undefined =
  Platform.OS === "android" ? NativeModules.AndroidSaf : undefined;

export async function scanFolderTree(
  treeUri: string,
  ignorePatterns?: string[],
): Promise<PickedFile[]> {
  if (!NativeSaf) return [];
  const files = await NativeSaf.indexFolderTree(treeUri, ignorePatterns ?? []);
  return files.map((file) => ({
    uri: file.uri,
    displayName: file.displayName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  }));
}

export class AndroidFolderIndexer implements FolderIndexer {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly sourceId?: string,
  ) {}

  async indexFolderTree(
    treeUri: string,
    options?: { ignorePatterns?: string[] },
  ): Promise<FolderIndexResult> {
    if (!NativeSaf) {
      return { filesFound: 0, filesAdded: 0 };
    }
    const picked = await scanFolderTree(treeUri, options?.ignorePatterns ?? []);
    const mediaItems = buildMediaItemsFromPickedFiles(
      picked,
      "audio",
      this.sourceId,
    );
    await addMediaItems(this.mediaRepository, mediaItems);
    return { filesFound: picked.length, filesAdded: mediaItems.length };
  }
}
