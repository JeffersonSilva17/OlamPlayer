import { create } from "zustand";
import { SettingsRepositorySqlite } from "../data/repositories/SettingsRepositorySqlite";

type SettingsStoreState = {
  clearing: boolean;
  clearLibrary: () => Promise<void>;
  autoPlayEnabled: boolean;
  autoPlayMinMs: number;
  autoPlayMaxMs: number;
  loadAutoPlaySettings: () => Promise<void>;
  setAutoPlayEnabled: (enabled: boolean) => Promise<void>;
  setAutoPlayMinMs: (valueMs: number) => Promise<void>;
  setAutoPlayMaxMs: (valueMs: number) => Promise<void>;
};

const repository = new SettingsRepositorySqlite();

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  clearing: false,
  autoPlayEnabled: false,
  autoPlayMinMs: 0,
  autoPlayMaxMs: 8 * 60 * 1000,
  async clearLibrary() {
    set({ clearing: true });
    try {
      await repository.clearLibrary();
    } catch (error) {
      console.warn("Falha ao limpar biblioteca", error);
    } finally {
      set({ clearing: false });
    }
  },
  async loadAutoPlaySettings() {
    try {
      const enabled = await repository.getAutoPlayEnabled();
      const minMs = await repository.getAutoPlayMinMs();
      const maxMs = await repository.getAutoPlayMaxMs();
      set({ autoPlayEnabled: enabled, autoPlayMinMs: minMs, autoPlayMaxMs: maxMs });
    } catch (error) {
      console.warn("Falha ao carregar auto play", error);
    }
  },
  async setAutoPlayEnabled(enabled) {
    set({ autoPlayEnabled: enabled });
    try {
      await repository.setAutoPlayEnabled(enabled);
    } catch (error) {
      console.warn("Falha ao salvar auto play", error);
    }
  },
  async setAutoPlayMinMs(valueMs) {
    set({ autoPlayMinMs: valueMs });
    try {
      await repository.setAutoPlayMinMs(valueMs);
    } catch (error) {
      console.warn("Falha ao salvar auto play", error);
    }
  },
  async setAutoPlayMaxMs(valueMs) {
    set({ autoPlayMaxMs: valueMs });
    try {
      await repository.setAutoPlayMaxMs(valueMs);
    } catch (error) {
      console.warn("Falha ao salvar auto play", error);
    }
  },
}));
