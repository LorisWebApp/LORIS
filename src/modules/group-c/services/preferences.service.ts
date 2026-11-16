/**
 * User preferences.
 *
 * Stored in localStorage using the key groupc.preferences.
 * No backend connection is required.
 */

export type ReaderTheme = "light" | "sepia" | "dark";

export type LineSpacing = "compact" | "normal" | "relaxed";

export type ReadingLayout = "focused" | "wide";

export type AppTextSize = "default" | "large" | "larger";

export type Landing = "dashboard" | "library";

export interface Preferences {
  reading: {
    fontSizeIndex: number;
    theme: ReaderTheme;
    lineSpacing: LineSpacing;
    layout: ReadingLayout;
  };

  notifications: {
    readingReminders: boolean;
    accountNotifications: boolean;
    systemAnnouncements: boolean;
  };

  accessibility: {
    textSize: AppTextSize;
    highContrast: boolean;
    letterSpacing: boolean;
    reduceMotion: boolean;
  };

  account: {
    language: string;
    landing: Landing;
  };
}

export const DEFAULT_PREFERENCES: Preferences = {
  reading: {
    fontSizeIndex: 1,
    theme: "light",
    lineSpacing: "normal",
    layout: "focused",
  },

  notifications: {
    readingReminders: false,
    accountNotifications: true,
    systemAnnouncements: true,
  },

  accessibility: {
    textSize: "default",
    highContrast: false,
    letterSpacing: false,
    reduceMotion: false,
  },

  account: {
    language: "en",
    landing: "dashboard",
  },
};

export const PREFERENCES_KEY = "groupc.preferences";

/** Checks whether a value belongs to an allowed set of options. */
function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && options.includes(value as T);
}

/** Combines stored preferences with defaults and validates their values. */
function mergePreferences(stored: Partial<Preferences>): Preferences {
  const reading: Partial<Preferences["reading"]> = stored.reading ?? {};
  const notifications: Partial<Preferences["notifications"]> =
    stored.notifications ?? {};
  const accessibility: Partial<Preferences["accessibility"]> =
    stored.accessibility ?? {};
  const account: Partial<Preferences["account"]> = stored.account ?? {};

  return {
    reading: {
      fontSizeIndex:
        typeof reading.fontSizeIndex === "number" &&
        Number.isInteger(reading.fontSizeIndex) &&
        reading.fontSizeIndex >= 0 &&
        reading.fontSizeIndex <= 5
          ? reading.fontSizeIndex
          : DEFAULT_PREFERENCES.reading.fontSizeIndex,

      theme: isOneOf(reading.theme, ["light", "sepia", "dark"])
        ? reading.theme
        : DEFAULT_PREFERENCES.reading.theme,

      lineSpacing: isOneOf(reading.lineSpacing, [
        "compact",
        "normal",
        "relaxed",
      ])
        ? reading.lineSpacing
        : DEFAULT_PREFERENCES.reading.lineSpacing,

      layout: isOneOf(reading.layout, ["focused", "wide"])
        ? reading.layout
        : DEFAULT_PREFERENCES.reading.layout,
    },

    notifications: {
      readingReminders:
        typeof notifications.readingReminders === "boolean"
          ? notifications.readingReminders
          : DEFAULT_PREFERENCES.notifications.readingReminders,

      accountNotifications:
        typeof notifications.accountNotifications === "boolean"
          ? notifications.accountNotifications
          : DEFAULT_PREFERENCES.notifications.accountNotifications,

      systemAnnouncements:
        typeof notifications.systemAnnouncements === "boolean"
          ? notifications.systemAnnouncements
          : DEFAULT_PREFERENCES.notifications.systemAnnouncements,
    },

    accessibility: {
      textSize: isOneOf(accessibility.textSize, ["default", "large", "larger"])
        ? accessibility.textSize
        : DEFAULT_PREFERENCES.accessibility.textSize,

      highContrast:
        typeof accessibility.highContrast === "boolean"
          ? accessibility.highContrast
          : DEFAULT_PREFERENCES.accessibility.highContrast,

      letterSpacing:
        typeof accessibility.letterSpacing === "boolean"
          ? accessibility.letterSpacing
          : DEFAULT_PREFERENCES.accessibility.letterSpacing,

      reduceMotion:
        typeof accessibility.reduceMotion === "boolean"
          ? accessibility.reduceMotion
          : DEFAULT_PREFERENCES.accessibility.reduceMotion,
    },

    account: {
      language:
        typeof account.language === "string" && account.language.trim()
          ? account.language
          : DEFAULT_PREFERENCES.account.language,

      landing: isOneOf(account.landing, ["dashboard", "library"])
        ? account.landing
        : DEFAULT_PREFERENCES.account.landing,
    },
  };
}

/**
 * Loads preferences from localStorage.
 * Falls back to defaults if storage is unavailable or invalid.
 */
export function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);

    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return DEFAULT_PREFERENCES;
    }

    return mergePreferences(parsed as Partial<Preferences>);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Saves preferences to localStorage.
 * Returns false if the browser refuses to store the value.
 */
export function savePreferences(prefs: Preferences): boolean {
  try {
    const validated = mergePreferences(prefs);

    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(validated));

    return true;
  } catch {
    return false;
  }
}
