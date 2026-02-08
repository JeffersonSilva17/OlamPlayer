import { Platform } from "react-native";
import { keepLocalCopy } from "@react-native-documents/picker";
import RNFS from "react-native-fs";
import type { PickedFile } from "../../domain/contracts";

const MEDIA_DIR = `${RNFS.DocumentDirectoryPath}/Media`;

function stripFileScheme(uri: string): string {
  return uri.startsWith("file://") ? uri.replace("file://", "") : uri;
}

async function ensureMediaDir(): Promise<void> {
  const exists = await RNFS.exists(MEDIA_DIR);
  if (!exists) {
    await RNFS.mkdir(MEDIA_DIR);
  }
}

async function uniqueTargetPath(fileName: string): Promise<string> {
  const basePath = `${MEDIA_DIR}/${fileName}`;
  const exists = await RNFS.exists(basePath);
  if (!exists) return basePath;
  const extIndex = fileName.lastIndexOf(".");
  const name = extIndex > 0 ? fileName.slice(0, extIndex) : fileName;
  const ext = extIndex > 0 ? fileName.slice(extIndex) : "";
  const stamped = `${name}-${Date.now()}${ext}`;
  return `${MEDIA_DIR}/${stamped}`;
}

export async function importToAppSandbox(files: PickedFile[]): Promise<PickedFile[]> {
  if (Platform.OS !== "ios") return files;
  if (files.length === 0) return files;

  await ensureMediaDir();

  const results: PickedFile[] = [];

  const externalFiles: PickedFile[] = [];
  for (const file of files) {
    const rawPath = stripFileScheme(file.uri);
    if (rawPath.startsWith(RNFS.DocumentDirectoryPath)) {
      const targetPath = await uniqueTargetPath(file.displayName ?? "arquivo");
      if (rawPath !== targetPath) {
        await RNFS.moveFile(rawPath, targetPath);
      }
      results.push({ ...file, uri: `file://${targetPath}` });
    } else {
      externalFiles.push(file);
    }
  }

  if (externalFiles.length === 0) return results;

  const copies = await keepLocalCopy({
    files: externalFiles.map((file) => ({
      uri: file.uri,
      fileName: file.displayName ?? "arquivo",
    })) as [any, ...any[]],
    destination: "documentDirectory",
  });

  for (let i = 0; i < externalFiles.length; i += 1) {
    const original = externalFiles[i];
    const copy = copies[i];
    if (copy.status === "success") {
      const localPath = stripFileScheme(copy.localUri);
      const targetPath = await uniqueTargetPath(original.displayName ?? "arquivo");
      await RNFS.moveFile(localPath, targetPath);
      results.push({
        ...original,
        uri: `file://${targetPath}`,
      });
    } else {
      results.push(original);
    }
  }

  return results;
}
