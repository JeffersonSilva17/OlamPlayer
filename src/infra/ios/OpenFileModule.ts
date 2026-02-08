import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import type { PickedFile } from "../../domain/contracts";

type OpenFilePayload = {
  files?: PickedFile[];
};

const NativeOpenFile = NativeModules.OpenFileModule;
const emitter =
  Platform.OS === "ios" && NativeOpenFile ? new NativeEventEmitter(NativeOpenFile) : null;

export function subscribeOpenFiles(onFiles: (files: PickedFile[]) => void): () => void {
  if (!emitter || !NativeOpenFile) {
    return () => {};
  }

  const handle = (payload: OpenFilePayload) => {
    if (!payload?.files || payload.files.length === 0) return;
    onFiles(payload.files);
  };

  const sub = emitter.addListener("OlamPlayerOpenFile", handle);

  if (typeof NativeOpenFile.getPendingFiles === "function") {
    NativeOpenFile.getPendingFiles().then((files: PickedFile[]) => {
      if (Array.isArray(files) && files.length > 0) {
        onFiles(files);
      }
    });
  }

  return () => {
    sub.remove();
  };
}
