import "react-native-get-random-values";
import React, { useEffect } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from "react-native-screens";
import type { LibraryStackParamList, PlaylistsStackParamList, RootTabParamList } from "./src/navigation/types";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { AddMediaScreen } from "./src/screens/AddMediaScreen";
import { PlayerScreen } from "./src/screens/PlayerScreen";
import { PlaylistsScreen } from "./src/screens/PlaylistsScreen";
import { PlaylistDetailScreen } from "./src/screens/PlaylistDetailScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { usePlayerStore } from "./src/stores/playerStore";
import { useMediaStore } from "./src/stores/mediaStore";
import { subscribeOpenFiles } from "./src/infra/ios/OpenFileModule";
import { MiniPlayer } from "./src/components/MiniPlayer";
import { theme } from "./src/theme/theme";

const Tab = createBottomTabNavigator<RootTabParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
const PlaylistsStack = createNativeStackNavigator<PlaylistsStackParamList>();

enableScreens();

function LibraryStackScreen() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShown: false }}>
      <LibraryStack.Screen name="Library" component={LibraryScreen} />
      <LibraryStack.Screen name="Player" component={PlayerScreen} />
    </LibraryStack.Navigator>
  );
}

function PlaylistsStackScreen() {
  return (
    <PlaylistsStack.Navigator screenOptions={{ headerShown: false }}>
      <PlaylistsStack.Screen name="Playlists" component={PlaylistsScreen} />
      <PlaylistsStack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
    </PlaylistsStack.Navigator>
  );
}

function App() {
  const { init } = usePlayerStore();
  const { addExternalFiles } = useMediaStore();
  useEffect(() => {
    init();
    const unsubscribe = subscribeOpenFiles(addExternalFiles);
    return () => {
      unsubscribe();
    };
  }, [init, addExternalFiles]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.bg} />
      <NavigationContainer>
        <View style={styles.container}>
          <SafeAreaView edges={["top"]} style={styles.appHeader}>
            <Text style={styles.appHeaderText}>OlamPlayer</Text>
          </SafeAreaView>
          <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Biblioteca" component={LibraryStackScreen} />
            <Tab.Screen name="Adicionar" component={AddMediaScreen} />
            <Tab.Screen name="Playlists" component={PlaylistsStackScreen} />
            <Tab.Screen name="Configuracoes" component={SettingsScreen} />
          </Tab.Navigator>
          <MiniPlayer />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  appHeader: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  appHeaderText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
    letterSpacing: 0.4,
  },
});

export default App;
