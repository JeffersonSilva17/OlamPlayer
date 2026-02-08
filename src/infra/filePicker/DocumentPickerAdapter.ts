import { Platform } from "react-native";
import { pick, pickDirectory, types, isErrorWithCode, errorCodes } from "@react-native-documents/picker";
import type { FilePickerAdapter, PickedFile, PickedFolder } from "../../domain/contracts";

function mapAcceptTypes(accept: ("audio" | "video")[]): string[] {
  const mapped: string[] = [];
  if (accept.includes("audio")) mapped.push(types.audio as string);
  if (accept.includes("video")) mapped.push(types.video as string);
  return mapped.length > 0 ? mapped : [types.allFiles as string];
}

export class DocumentPickerAdapter implements FilePickerAdapter {
  async pickFiles(accept: ("audio" | "video")[]): Promise<PickedFile[]> {
    try {
      const results = await pick({
        type: mapAcceptTypes(accept),
        allowMultiSelection: true,
        ...(Platform.OS === "android"
          ? { mode: "open", requestLongTermAccess: true }
          : { mode: "import" }),
      });
      return results.map((file) => ({
        uri: file.uri,
        displayName: file.name ?? undefined,
        mimeType: file.type ?? undefined,
        sizeBytes: file.size ?? undefined,
      }));
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        return [];
      }
      throw err;
    }
  }

  async pickFolder(): Promise<PickedFolder> {
    if (Platform.OS !== "android") {
      throw new Error("pickFolder is only supported on Android");
    }
    const result = await pickDirectory({ requestLongTermAccess: true });
    return {
      uri: result.uri,
    };
  }
}
