import React, { useEffect, useMemo, useState } from "react";
import { Platform, View, Text, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useMediaStore } from "../stores/mediaStore";
import { ScreenBackdrop } from "../components/ScreenBackdrop";
import { useTheme } from "../theme/ThemeProvider";
import type { AppTheme } from "../theme/theme";

export function AddMediaScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    addFiles,
    addFolder,
    indexing,
    indexStatus,
    ignoredFolders,
    refreshIgnoredFolders,
    addIgnoredFolder,
    removeIgnoredFolder,
  } = useMediaStore();
  const [newIgnore, setNewIgnore] = useState("");

  useEffect(() => {
    refreshIgnoredFolders();
  }, [refreshIgnoredFolders]);

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <Text style={styles.title}>Adicionar midia</Text>
      <Pressable
        style={styles.button}
        onPress={async () => {
          const added = await addFiles(["audio", "video"]);
          if (added > 0) {
            Alert.alert("Sucesso", "Adicionado com sucesso!");
          }
        }}
      >
      <Text style={styles.buttonText}>Adicionar arquivos</Text>
      </Pressable>
      {Platform.OS === "android" ? (
        <Pressable style={styles.button} onPress={() => addFolder()}>
          <Text style={styles.buttonText}>Adicionar pasta</Text>
        </Pressable>
      ) : null}
      {indexing ? <Text style={styles.status}>Indexando pasta...</Text> : null}
      {indexStatus ? (
        <Text style={styles.status}>
          Encontrados: {indexStatus.filesFound} - Adicionados: {indexStatus.filesAdded}
          {indexStatus.filesSkipped ? ` - Ignorados: ${indexStatus.filesSkipped}` : ""}
        </Text>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pastas ignoradas (Android)</Text>
        <View style={styles.inline}>
          <TextInput
            style={styles.input}
            placeholder="Ex: WhatsApp"
            placeholderTextColor={theme.colors.textMuted}
            value={newIgnore}
            onChangeText={setNewIgnore}
          />
          <Pressable
            style={styles.smallButton}
            onPress={() => {
              addIgnoredFolder(newIgnore);
              setNewIgnore("");
            }}
          >
            <Text style={styles.smallButtonText}>Adicionar</Text>
          </Pressable>
        </View>
        {ignoredFolders.map((pattern) => (
          <View key={pattern} style={styles.ignoreRow}>
            <Text style={styles.ignoreText}>{pattern}</Text>
            <Pressable style={styles.removeButton} onPress={() => removeIgnoredFolder(pattern)}>
              <Text style={styles.removeText}>Remover</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
    textAlign: "center",
  },
  button: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.surface,
    fontWeight: "600",
    fontFamily: theme.fonts.body,
  },
  status: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fonts.body,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  inline: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  smallButton: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  smallButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  ignoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  ignoreText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  removeButton: {
    paddingHorizontal: 8,
  },
  removeText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
  },
  });
