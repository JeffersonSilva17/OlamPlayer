/**
 * @format
 */

import "react-native-gesture-handler";
import { AppRegistry } from "react-native";
import TrackPlayer from "react-native-track-player";
import App from "./App";
import { name as appName } from "./app.json";
import trackPlayerService from "./src/infra/player/trackPlayerService";

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => trackPlayerService);
