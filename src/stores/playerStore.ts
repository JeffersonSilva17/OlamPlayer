import { create } from "zustand";
import type { MediaItem } from "../models/media";
import type { PlayerController, PlayerState } from "../domain/contracts";
import { getPlayerController } from "../infra/player/playerController";

type PlayerStoreState = {
  controller?: PlayerController;
  current?: MediaItem;
  queue?: MediaItem[];
  queueLabel?: string;
  state: PlayerState;
  init: () => Promise<void>;
  setCurrent: (item: MediaItem) => void;
  setQueue: (items: MediaItem[], label?: string) => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
};

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  state: {
    isPlaying: false,
    positionMs: 0,
    durationMs: undefined,
    speed: 1,
    mediaType: undefined,
  },
  async init() {
    if (get().controller) return;
    const controller = await getPlayerController();
    controller.onStateChanged((state) => set({ state }));
    set({ controller });
  },
  setCurrent(item) {
    set({ current: item });
  },
  setQueue(items, label) {
    set({ queue: items, queueLabel: label });
  },
  async play() {
    const controller = get().controller;
    if (!controller) return;
    await controller.play();
  },
  async pause() {
    const controller = get().controller;
    if (!controller) return;
    await controller.pause();
  },
  async seekTo(positionMs: number) {
    const controller = get().controller;
    if (!controller) return;
    await controller.seekTo(positionMs);
  },
  async setSpeed(speed: number) {
    const controller = get().controller;
    if (!controller) return;
    await controller.setSpeed(speed);
  },
}));
