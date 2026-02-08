import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Video, { OnLoadData } from "react-native-video";
import type { MediaItem } from "../models/media";

type Props = {
  items: MediaItem[];
  enabled: boolean;
  onDuration: (item: MediaItem, durationMs: number) => void;
  onDone?: () => void;
};

export function DurationProbe({ items, enabled, onDuration, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setIndex(0);
    setActive(enabled);
  }, [items, enabled]);

  const current = useMemo(() => {
    if (!active || items.length === 0) return null;
    return items[index] ?? null;
  }, [active, items, index]);

  useEffect(() => {
    if (!active || items.length === 0) return;
    if (index >= items.length) {
      setActive(false);
      onDone?.();
    }
  }, [active, items.length, index, onDone]);

  const handleLoad = (data: OnLoadData) => {
    if (!current) return;
    const durationMs = Math.floor(data.duration * 1000);
    if (durationMs > 0) {
      onDuration(current, durationMs);
    }
    setTimeout(() => {
      setIndex((prev) => prev + 1);
    }, 350);
  };

  const handleError = () => {
    setTimeout(() => {
      setIndex((prev) => prev + 1);
    }, 350);
  };

  if (!current) return null;

  return (
    <View style={{ width: 0, height: 0, opacity: 0 }}>
      <Video
        source={{ uri: current.uri }}
        paused
        muted
        repeat={false}
        playInBackground={false}
        playWhenInactive={false}
        onLoad={handleLoad}
        onError={handleError}
        style={{ width: 0, height: 0 }}
      />
    </View>
  );
}
