import { createSampleProfile } from "../data/seed";
import { AppState, Profile } from "../types";

export const STORAGE_KEY = "imunisasi-app-v1";
export const SCHEMA_VERSION = 1;

export function getInitialState(): AppState {
  const sample = createSampleProfile();
  return {
    schemaVersion: SCHEMA_VERSION,
    profiles: [sample],
    activeProfileId: sample.id,
    paymentMode: "HYBRID"
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      saveAppState(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.profiles)) {
      console.warn("Data profil tidak valid di localStorage, beralih ke data awal.");
      const initial = getInitialState();
      saveAppState(initial);
      return initial;
    }

    // If profiles array is empty, clear activeProfileId
    if (parsed.profiles.length === 0) {
      return {
        schemaVersion: parsed.schemaVersion || SCHEMA_VERSION,
        profiles: [],
        activeProfileId: "",
        paymentMode: parsed.paymentMode || "HYBRID"
      };
    }

    // Ensure active profile exists
    const hasActive = parsed.profiles.some((p: Profile) => p.id === parsed.activeProfileId);
    if (!hasActive) {
      parsed.activeProfileId = parsed.profiles[0]?.id || "";
    }

    return {
      schemaVersion: parsed.schemaVersion || SCHEMA_VERSION,
      profiles: parsed.profiles,
      activeProfileId: parsed.activeProfileId,
      paymentMode: parsed.paymentMode || "HYBRID"
    };
  } catch (error) {
    console.error("Gagal membaca localStorage, beralih ke data awal:", error);
    const initial = getInitialState();
    return initial;
  }
}

export function saveAppState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan ke localStorage:", error);
    return false;
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Gagal menghapus localStorage:", e);
  }
}
