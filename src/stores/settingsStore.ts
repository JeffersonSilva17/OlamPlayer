import { create } from "zustand";
import { SettingsRepositorySqlite } from "../data/repositories/SettingsRepositorySqlite";

type SettingsStoreState = {
  clearing: boolean;
  clearLibrary: () => Promise<void>;
};

const repository = new SettingsRepositorySqlite();

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  clearing: false,
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
}));
