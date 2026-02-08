import TrackPlayer, { Event } from "react-native-track-player";

export default async function trackPlayerService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) =>
    TrackPlayer.seekTo(event.position),
  );
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
}
