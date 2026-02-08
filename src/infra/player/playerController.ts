import type { PlayerController } from "../../domain/contracts";
import { initTrackPlayer, TrackPlayerController } from "./TrackPlayerController";

let controller: PlayerController | null = null;

export async function getPlayerController(): Promise<PlayerController> {
  if (!controller) {
    await initTrackPlayer();
    controller = new TrackPlayerController();
  }
  return controller;
}
