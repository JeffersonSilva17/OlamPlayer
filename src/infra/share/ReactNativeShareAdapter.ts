import { Alert, Platform } from "react-native";
import Share from "react-native-share";
import RNFS from "react-native-fs";
import type { ShareAdapter } from "../../domain/contracts";
import { androidSafService } from "../android/AndroidSafService";

function normalizeUri(uri?: string): string | undefined {
  if (!uri) return undefined;
  const trimmed = uri.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("://")) return trimmed;
  if (trimmed.startsWith("/")) return `file://${trimmed}`;
  return trimmed;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "_");
}

async function ensureShareCacheDir(): Promise<string> {
  const dir = `${RNFS.CachesDirectoryPath}/Share`;
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir);
  }
  return dir;
}

async function materializeContentUri(uri: string, fileName: string): Promise<string> {
  const dir = await ensureShareCacheDir();
  const safeName = sanitizeFileName(fileName || "arquivo");
  const targetPath = `${dir}/${Date.now()}-${safeName}`;
  await RNFS.copyFile(uri, targetPath);
  return `file://${targetPath}`;
}

export const reactNativeShareAdapter: ShareAdapter = {
  async shareFile(params) {
    const normalized = normalizeUri(params.uri);
    if (!normalized) {
      Alert.alert("Compartilhar", "Arquivo invalido ou indisponivel.");
      return;
    }
    let shareUrl = normalized;
    if (Platform.OS === "android" && normalized.startsWith("content://")) {
      try {
        if (androidSafService.copyToCache) {
          shareUrl = await androidSafService.copyToCache(normalized, params.title ?? "arquivo");
        } else {
          shareUrl = await materializeContentUri(normalized, params.title ?? "arquivo");
        }
      } catch (error) {
        console.warn("Falha ao copiar arquivo para compartilhar", error);
        shareUrl = normalized;
      }
    }
    try {
      await Share.open({
        title: params.title ?? "Compartilhar",
        urls: [shareUrl],
        type: params.mimeType ?? "application/octet-stream",
        filename: params.title ?? "arquivo",
        failOnCancel: false,
        useInternalStorage: true,
      });
    } catch (error) {
      console.warn("Falha ao abrir compartilhamento (urls)", error);
      try {
        await Share.open({
          title: params.title ?? "Compartilhar",
          url: shareUrl,
          type: params.mimeType ?? "application/octet-stream",
          filename: params.title ?? "arquivo",
          failOnCancel: false,
          useInternalStorage: true,
        });
      } catch (fallbackError) {
        console.warn("Falha ao abrir compartilhamento (url)", fallbackError);
        const detail =
          __DEV__ && fallbackError
            ? `\n${String((fallbackError as Error).message ?? fallbackError)}`
            : "";
        Alert.alert("Compartilhar", `Nao foi possivel abrir o compartilhamento.${detail}`);
      }
    }
  },
};
