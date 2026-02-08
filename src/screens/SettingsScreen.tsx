import React from "react";
import { View, Text, Pressable, StyleSheet, Alert, BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../navigation/types";
import { useSettingsStore } from "../stores/settingsStore";
import { useMediaStore } from "../stores/mediaStore";
import { theme } from "../theme/theme";
import { ScreenBackdrop } from "../components/ScreenBackdrop";

type Navigation = NativeStackNavigationProp<SettingsStackParamList, "Settings">;

export function SettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { clearLibrary, clearing } = useSettingsStore();
  const { loadMedia } = useMediaStore();

  const onClear = async () => {
    Alert.alert("Limpar biblioteca", "Isso remove apenas o catálogo local.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: async () => {
          await clearLibrary();
          await loadMedia("audio");
          await loadMedia("video");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <Text style={styles.title}>Configurações</Text>
      <Pressable
        style={styles.rowItem}
        onPress={() => navigation.navigate("AutoPlaySettings")}
      >
        <Text style={styles.rowItemText}>Reprodução automática</Text>
      </Pressable>
      <Pressable
        style={styles.rowItem}
        onPress={() =>
          Alert.alert("Sair do app", "Deseja sair do aplicativo?", [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Sair",
              style: "destructive",
              onPress: () => BackHandler.exitApp(),
            },
          ])
        }
      >
        <Text style={styles.rowItemText}>Sair do app</Text>
      </Pressable>
      <Pressable style={styles.dangerButton} onPress={onClear} disabled={clearing}>
        <Text style={styles.buttonText}>Limpar biblioteca</Text>
      </Pressable>
      <Text style={styles.caption}>
        A limpeza remove apenas o catálogo do SQLite. Os arquivos originais permanecem.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
  },
  rowItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  rowItemText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: theme.colors.danger,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.surface,
    fontWeight: "600",
    fontFamily: theme.fonts.body,
  },
  caption: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
});
