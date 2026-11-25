import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
} from "../services/preferences.service";

/**
 * Shared preferences store.
 * Keeps preference changes synchronized across components and browser tabs.
 */

let current = loadPreferences();

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === "groupc.preferences") {
      current = loadPreferences();
      emit();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
};

const getSnapshot = (): Preferences => current;

export function usePreferences() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /** Applies a preference change and saves it to browser storage. */
  const update = useCallback(
    (change: (preferences: Preferences) => Preferences): boolean => {
      const previous = current;
      const next = change(previous);

      current = next;
      emit();

      const saved = savePreferences(next);

      if (!saved) {
        current = previous;
        emit();
        return false;
      }

      return true;
    },
    [],
  );

  /** Restores all preferences to their default values. */
  const reset = useCallback((): boolean => {
    const previous = current;

    current = DEFAULT_PREFERENCES;
    emit();

    const saved = savePreferences(DEFAULT_PREFERENCES);

    if (!saved) {
      current = previous;
      emit();
      return false;
    }

    return true;
  }, []);

  return {
    prefs,
    update,
    reset,
  };
}
