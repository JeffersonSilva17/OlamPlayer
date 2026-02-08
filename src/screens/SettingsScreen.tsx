import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useSettingsStore } from "../stores/settingsStore";
import { useMediaStore } from "../stores/mediaStore";
import { theme } from "../theme/theme";
import { ScreenBackdrop } from "../components/ScreenBackdrop";

export function SettingsScreen() {
  const { clearLibrary, clearing } = useSettingsStore();
  const { loadMedia } = useMediaStore();

  const onClear = async () => {
    Alert.alert("Limpar biblioteca", "Isso remove apenas o catalogo local.", [
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
      <Text style={styles.title}>Configuracoes</Text>
      <Pressable style={styles.button} onPress={onClear} disabled={clearing}>
        <Text style={styles.buttonText}>Limpar biblioteca</Text>
      </Pressable>
      <Text style={styles.caption}>
        A limpeza remove apenas o catalogo do SQLite. Os arquivos originais permanecem.
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
  button: {
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
