import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { useSettingsStore } from "../stores/settingsStore";
import { theme } from "../theme/theme";
import { ScreenBackdrop } from "../components/ScreenBackdrop";

const MAX_MINUTES = 600;

function clampMinutes(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(0, Math.round(value)), MAX_MINUTES);
}

function formatMinutes(value: number): string {
  const clamped = clampMinutes(value);
  if (clamped < 60) return `${clamped} min`;
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function AutoPlaySettingsScreen() {
  const {
    autoPlayEnabled,
    autoPlayMinMs,
    autoPlayMaxMs,
    loadAutoPlaySettings,
    setAutoPlayEnabled,
    setAutoPlayMinMs,
    setAutoPlayMaxMs,
  } = useSettingsStore();

  const [minMinutes, setMinMinutes] = useState(0);
  const [maxMinutes, setMaxMinutes] = useState(8);
  const [minInput, setMinInput] = useState("0");
  const [maxInput, setMaxInput] = useState("8");

  useEffect(() => {
    loadAutoPlaySettings();
  }, [loadAutoPlaySettings]);

  useEffect(() => {
    const min = Math.round(autoPlayMinMs / 60000);
    const max = Math.round(autoPlayMaxMs / 60000);
    setMinMinutes(min);
    setMaxMinutes(max);
    setMinInput(String(min));
    setMaxInput(String(max));
  }, [autoPlayMinMs, autoPlayMaxMs]);

  const applyMin = (value: number) => {
    const nextMin = clampMinutes(value);
    const nextMax = Math.max(nextMin, maxMinutes);
    setMinMinutes(nextMin);
    setMaxMinutes(nextMax);
    setMinInput(String(nextMin));
    setMaxInput(String(nextMax));
    // dirty is derived below
  };

  const applyMax = (value: number) => {
    const nextMax = clampMinutes(value);
    const nextMin = Math.min(minMinutes, nextMax);
    setMinMinutes(nextMin);
    setMaxMinutes(nextMax);
    setMinInput(String(nextMin));
    setMaxInput(String(nextMax));
    // dirty is derived below
  };

  const rangeLabel = useMemo(
    () => `${formatMinutes(minMinutes)}  ~  ${formatMinutes(maxMinutes)}`,
    [minMinutes, maxMinutes],
  );

  const onSave = async () => {
    const nextMin = clampMinutes(Number(minInput));
    const nextMax = clampMinutes(Number(maxInput));
    const fixedMin = Math.min(nextMin, nextMax);
    const fixedMax = Math.max(nextMin, nextMax);
    setMinMinutes(fixedMin);
    setMaxMinutes(fixedMax);
    setMinInput(String(fixedMin));
    setMaxInput(String(fixedMax));
    await setAutoPlayMinMs(fixedMin * 60000);
    await setAutoPlayMaxMs(fixedMax * 60000);
  };

  const isDirty = useMemo(() => {
    const storedMin = Math.round(autoPlayMinMs / 60000);
    const storedMax = Math.round(autoPlayMaxMs / 60000);
    return storedMin !== minMinutes || storedMax !== maxMinutes;
  }, [autoPlayMinMs, autoPlayMaxMs, minMinutes, maxMinutes]);

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <Text style={styles.title}>Reprodução automática</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Ativar ao abrir Áudios</Text>
          <Switch
            value={autoPlayEnabled}
            onValueChange={(value) => setAutoPlayEnabled(value)}
            thumbColor={autoPlayEnabled ? theme.colors.accent : theme.colors.border}
            trackColor={{ true: theme.colors.brand, false: theme.colors.border }}
          />
        </View>
        <Text style={styles.sectionSubtitle}>Limite de tempo</Text>
        <Text style={styles.rangeText}>{rangeLabel}</Text>
        <View style={styles.sliderGroup}>
          <Text style={styles.sliderLabel}>Mínimo</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={MAX_MINUTES}
            value={minMinutes}
            onValueChange={(value) => {
              const next = Math.round(Number(value));
              setMinMinutes(next);
              setMinInput(String(next));
            }}
            onSlidingComplete={(value) => applyMin(Number(value))}
            minimumTrackTintColor={theme.colors.brand}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.accent}
          />
        </View>
        <View style={styles.sliderGroup}>
          <Text style={styles.sliderLabel}>Máximo</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={MAX_MINUTES}
            value={maxMinutes}
            onValueChange={(value) => {
              const next = Math.round(Number(value));
              setMaxMinutes(next);
              setMaxInput(String(next));
            }}
            onSlidingComplete={(value) => applyMax(Number(value))}
            minimumTrackTintColor={theme.colors.brand}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.accent}
          />
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Min (min)</Text>
            <TextInput
              value={minInput}
              onChangeText={(text) => {
                setMinInput(text);
                const parsed = Number(text);
                if (!Number.isNaN(parsed)) {
                  setMinMinutes(clampMinutes(parsed));
                }
              }}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Max (min)</Text>
            <TextInput
              value={maxInput}
              onChangeText={(text) => {
                setMaxInput(text);
                const parsed = Number(text);
                if (!Number.isNaN(parsed)) {
                  setMaxMinutes(clampMinutes(parsed));
                }
              }}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>
        <Pressable
          style={[styles.saveButton, !isDirty && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={!isDirty}
        >
          <Text style={styles.saveButtonText}>Salvar alterações</Text>
        </Pressable>
        <Text style={styles.caption}>
          Observação: se a duração não estiver disponível, o arquivo pode ser incluído.
        </Text>
      </View>
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
  section: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fonts.body,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  rowLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontWeight: "600",
  },
  rangeText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
  },
  sliderGroup: {
    marginBottom: theme.spacing.sm,
  },
  sliderLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginBottom: 4,
  },
  slider: {
    width: "100%",
    height: 32,
  },
  inputRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    fontFamily: theme.fonts.body,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceAlt,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.bg,
    fontWeight: "800",
    fontFamily: theme.fonts.body,
  },
  caption: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
});
