import { NativeModules, Platform } from "react-native";
import type { AndroidSafService } from "../../domain/contracts";

type AndroidSafNative = {
  takePersistablePermission(uri: string): Promise<void>;
  copyToCache?: (uri: string, fileName?: string | null) => Promise<string>;
};

const NativeSaf: AndroidSafNative | undefined =
  Platform.OS === "android" ? NativeModules.AndroidSaf : undefined;
const canCopyToCache = typeof NativeSaf?.copyToCache === "function";

export const androidSafService: AndroidSafService = {
  async takePersistablePermission(uri: string): Promise<void> {
    if (!NativeSaf) return;
    await NativeSaf.takePersistablePermission(uri);
  },
  copyToCache: canCopyToCache
    ? async (uri: string, fileName?: string): Promise<string> =>
        NativeSaf!.copyToCache!(uri, fileName ?? null)
    : undefined,
};
