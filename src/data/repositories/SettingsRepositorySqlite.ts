import type { SettingsRepository } from "../../domain/contracts";
import { getDb } from "../sqlite/db";
import { getResultRows } from "../sqlite/queryResult";

const AUTO_PLAY_ENABLED_KEY = "auto_play_enabled";
const AUTO_PLAY_RULE_KEY = "auto_play_rule";
const AUTO_PLAY_MIN_MS_KEY = "auto_play_min_ms";
const AUTO_PLAY_MAX_MS_KEY = "auto_play_max_ms";
const THEME_MODE_KEY = "theme_mode";
const DEFAULT_AUTO_PLAY_ENABLED = true;
const DEFAULT_AUTO_PLAY_MIN_MS = 0;
const DEFAULT_AUTO_PLAY_MAX_MS = 8 * 60 * 1000;
const DEFAULT_THEME_MODE = "dark";
const MAX_RANGE_MS = 10 * 60 * 60 * 1000;

export class SettingsRepositorySqlite implements SettingsRepository {
  private async getSetting(key: string): Promise<string | null> {
    const db = await getDb();
    const result = await db.executeAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?;`,
      [key],
    );
    const rows = getResultRows(result);
    return rows[0]?.value ?? null;
  }

  private async setSetting(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `INSERT INTO app_settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      [key, value],
    );
  }

  private clampRange(valueMs: number): number {
    if (Number.isNaN(valueMs)) return 0;
    return Math.min(Math.max(0, valueMs), MAX_RANGE_MS);
  }

  private mapRuleToRange(rule: string): { minMs: number; maxMs: number } {
    switch (rule) {
      case "max8min":
        return { minMs: 0, maxMs: 8 * 60 * 1000 };
      case "max90min":
        return { minMs: 0, maxMs: 90 * 60 * 1000 };
      case "min40max120":
        return { minMs: 40 * 60 * 1000, maxMs: 120 * 60 * 1000 };
      case "max8h":
        return { minMs: 0, maxMs: 8 * 60 * 60 * 1000 };
      default:
        return { minMs: DEFAULT_AUTO_PLAY_MIN_MS, maxMs: DEFAULT_AUTO_PLAY_MAX_MS };
    }
  }

  private async getAutoPlayRange(): Promise<{ minMs: number; maxMs: number }> {
    const minValue = await this.getSetting(AUTO_PLAY_MIN_MS_KEY);
    const maxValue = await this.getSetting(AUTO_PLAY_MAX_MS_KEY);
    if (minValue != null || maxValue != null) {
      const minMs = this.clampRange(Number(minValue ?? DEFAULT_AUTO_PLAY_MIN_MS));
      const maxMs = this.clampRange(Number(maxValue ?? DEFAULT_AUTO_PLAY_MAX_MS));
      const fixed = maxMs < minMs ? { minMs: maxMs, maxMs: minMs } : { minMs, maxMs };
      return fixed;
    }

    const legacyRule = await this.getSetting(AUTO_PLAY_RULE_KEY);
    if (legacyRule) {
      const mapped = this.mapRuleToRange(legacyRule);
      await this.setSetting(AUTO_PLAY_MIN_MS_KEY, String(mapped.minMs));
      await this.setSetting(AUTO_PLAY_MAX_MS_KEY, String(mapped.maxMs));
      return mapped;
    }

    return { minMs: DEFAULT_AUTO_PLAY_MIN_MS, maxMs: DEFAULT_AUTO_PLAY_MAX_MS };
  }

  async listIgnoredFolders(): Promise<string[]> {
    const db = await getDb();
    const result = await db.executeAsync<{ pattern: string }>(
      `SELECT pattern FROM ignored_folders ORDER BY pattern ASC;`,
    );
    const rows = getResultRows(result);
    return rows.map((row) => row.pattern);
  }

  async addIgnoredFolder(pattern: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(
      `INSERT OR IGNORE INTO ignored_folders (pattern) VALUES (?);`,
      [pattern.trim()],
    );
  }

  async removeIgnoredFolder(pattern: string): Promise<void> {
    const db = await getDb();
    await db.executeAsync(`DELETE FROM ignored_folders WHERE pattern = ?;`, [
      pattern.trim(),
    ]);
  }

  async clearLibrary(): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.executeAsync(`DELETE FROM playlist_items;`);
      await tx.executeAsync(`DELETE FROM playlists;`);
      await tx.executeAsync(`DELETE FROM media_items;`);
      await tx.executeAsync(`DELETE FROM media_sources;`);
    });
  }

  async getAutoPlayEnabled(): Promise<boolean> {
    const value = await this.getSetting(AUTO_PLAY_ENABLED_KEY);
    if (value == null) return DEFAULT_AUTO_PLAY_ENABLED;
    return value === "1";
  }

  async setAutoPlayEnabled(enabled: boolean): Promise<void> {
    await this.setSetting(AUTO_PLAY_ENABLED_KEY, enabled ? "1" : "0");
  }

  async getAutoPlayMinMs(): Promise<number> {
    const range = await this.getAutoPlayRange();
    return range.minMs;
  }

  async setAutoPlayMinMs(valueMs: number): Promise<void> {
    const minMs = this.clampRange(valueMs);
    await this.setSetting(AUTO_PLAY_MIN_MS_KEY, String(minMs));
  }

  async getAutoPlayMaxMs(): Promise<number> {
    const range = await this.getAutoPlayRange();
    return range.maxMs;
  }

  async setAutoPlayMaxMs(valueMs: number): Promise<void> {
    const maxMs = this.clampRange(valueMs);
    await this.setSetting(AUTO_PLAY_MAX_MS_KEY, String(maxMs));
  }

  async getThemeMode(): Promise<"dark" | "light"> {
    const value = await this.getSetting(THEME_MODE_KEY);
    if (value === "light") return "light";
    if (value === "dark") return "dark";
    return DEFAULT_THEME_MODE;
  }

  async setThemeMode(mode: "dark" | "light"): Promise<void> {
    await this.setSetting(THEME_MODE_KEY, mode);
  }
}
