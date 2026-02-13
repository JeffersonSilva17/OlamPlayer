import TrackPlayer from "react-native-track-player";
import type { MediaItem } from "../../models/media";
import { initTrackPlayer } from "./TrackPlayerController";

export async function playQueue(items: MediaItem[], label?: string): Promise<void> {
  if (items.length === 0) return;
  await initTrackPlayer();
  await TrackPlayer.reset();
  await TrackPlayer.add(
    items.map((item) => ({
      id: item.id,
      url: item.uri,
      title: item.displayName,
      artist: "LinkFlow",
      album: label ?? "Biblioteca",
    })),
  );
  await TrackPlayer.play();
}
