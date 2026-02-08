import "react-native-get-random-values";
import React, { useEffect } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from "react-native-screens";
import type {
  LibraryStackParamList,
  PlaylistsStackParamList,
  RootTabParamList,
  SettingsStackParamList,
} from "./src/navigation/types";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { PlayerScreen } from "./src/screens/PlayerScreen";
import { PlaylistsScreen } from "./src/screens/PlaylistsScreen";
import { PlaylistDetailScreen } from "./src/screens/PlaylistDetailScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AutoPlaySettingsScreen } from "./src/screens/AutoPlaySettingsScreen";
import { usePlayerStore } from "./src/stores/playerStore";
import { useMediaStore } from "./src/stores/mediaStore";
import { subscribeOpenFiles } from "./src/infra/ios/OpenFileModule";
import { MiniPlayer } from "./src/components/MiniPlayer";
import { theme } from "./src/theme/theme";
import { icons } from "./src/theme/icons";

const Tab = createBottomTabNavigator<RootTabParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
const PlaylistsStack = createNativeStackNavigator<PlaylistsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const navigationRef = createNavigationContainerRef<RootTabParamList>();

enableScreens();

function AudioStackScreen() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShown: false }}>
      <LibraryStack.Screen
        name="Library"
        component={LibraryScreen}
        initialParams={{ mediaType: "audio", hideTabs: true, showAddButton: true }}
      />
      <LibraryStack.Screen name="Player" component={PlayerScreen} />
    </LibraryStack.Navigator>
  );
}

function VideoStackScreen() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShown: false }}>
      <LibraryStack.Screen
        name="Library"
        component={LibraryScreen}
        initialParams={{ mediaType: "video", hideTabs: true, showAddButton: true }}
      />
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

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="AutoPlaySettings" component={AutoPlaySettingsScreen} />
    </SettingsStack.Navigator>
  );
}

function AppShell() {
  const { init } = usePlayerStore();
  const { addExternalFiles } = useMediaStore();
  const [currentRoute, setCurrentRoute] = React.useState<string | null>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    init();
    const unsubscribe = subscribeOpenFiles(addExternalFiles);
    return () => {
      unsubscribe();
    };
  }, [init, addExternalFiles]);

  const getActiveRouteName = (state: any): string => {
    if (!state || !state.routes || state.index == null) return "";
    const route = state.routes[state.index];
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          if (navigationRef.isReady()) {
            const name = getActiveRouteName(navigationRef.getRootState());
            setCurrentRoute(name);
          }
        }}
        onStateChange={(state) => {
          const name = getActiveRouteName(state);
          setCurrentRoute(name);
        }}
      >
        <View style={styles.container}>
          <SafeAreaView edges={["top"]} style={styles.appHeader}>
            <Text style={styles.appHeaderText}>OlamPlayer</Text>
          </SafeAreaView>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
                height: 56 + insets.bottom,
                paddingBottom: Math.max(insets.bottom, 6),
              },
              tabBarActiveTintColor: theme.colors.accent,
              tabBarInactiveTintColor: theme.colors.textMuted,
              tabBarLabelStyle: {
                fontSize: 11,
                fontFamily: theme.fonts.body,
              },
            }}
          >
            <Tab.Screen
              name="Video"
              component={VideoStackScreen}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Text
                    style={[
                      styles.tabIcon,
                      { color },
                      focused && styles.tabIconActive,
                    ]}
                  >
                    {icons.video}
                  </Text>
                ),
              }}
            />
            <Tab.Screen
              name="Audio"
              component={AudioStackScreen}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Text
                    style={[
                      styles.tabIcon,
                      { color },
                      focused && styles.tabIconActive,
                    ]}
                  >
                    {icons.audio}
                  </Text>
                ),
              }}
            />
            <Tab.Screen
              name="Playlists"
              component={PlaylistsStackScreen}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Text
                    style={[
                      styles.tabIcon,
                      { color },
                      focused && styles.tabIconActive,
                    ]}
                  >
                    {icons.tabsPlaylists}
                  </Text>
                ),
              }}
            />
            <Tab.Screen
              name="Configuracoes"
              component={SettingsStackScreen}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Text
                    style={[
                      styles.tabIcon,
                      { color },
                      focused && styles.tabIconActive,
                    ]}
                  >
                    {icons.settings}
                  </Text>
                ),
              }}
            />
          </Tab.Navigator>
          {currentRoute !== "Player" ? <MiniPlayer /> : null}
        </View>
      </NavigationContainer>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
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
  tabIcon: {
    fontSize: 18,
    fontFamily: theme.fonts.body,
  },
  tabIconActive: {
    textShadowColor: theme.colors.accent,
    textShadowRadius: 6,
  },
});

export default App;
