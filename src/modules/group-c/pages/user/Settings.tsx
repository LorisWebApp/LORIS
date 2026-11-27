import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { USER_ROUTES } from "../../config/userRoutes";
import { FONT_SCALES } from "../../components/reader/ReaderControls";
import {
  LINE_HEIGHT,
  READER_THEMES,
} from "../../components/reader/readerTheme";
import {
  ChoiceGroup,
  SelectField,
  ToggleField,
} from "../../components/user/FormFields";
import {
  Button,
  ConfirmationDialog,
  PageHeader,
  SectionHeader,
  ToastNotification,
  cx,
} from "../../components/user/sharedUi";
import { usePreferences } from "../../hooks/usePreferences";

import type {
  AppTextSize,
  Landing,
  LineSpacing,
  Preferences,
  ReaderFontFamily,
  ReaderTheme,
  ReadingLayout,
} from "../../services/preferences.service";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ny", label: "Chinyanja" },
  { value: "bem", label: "Chibemba" },
];

const FONT_LABELS = ["Small", "Default", "Large", "Larger", "Largest"];

const DEFAULT_FONT_INDEX = 1;

function getFontIndex(index: number): number {
  if (!Number.isInteger(index)) {
    return DEFAULT_FONT_INDEX;
  }

  return Math.min(Math.max(index, 0), FONT_SCALES.length - 1);
}

/** Group C application preferences. Route: /user/settings. */
export function Settings() {
  const { prefs, update, reset } = usePreferences();

  const [confirmReset, setConfirmReset] = useState(false);

  const [toast, setToast] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  /** Every control saves immediately. */
  const change = (fn: (p: Preferences) => Preferences) => {
    const saved = update(fn);

    setToast(
      saved
        ? {
            variant: "success",
            message: "Preference saved.",
          }
        : {
            variant: "error",
            message:
              "Saved for this visit only – your browser blocked storage.",
          },
    );
  };

  const fontIndex = getFontIndex(prefs.reading.fontSizeIndex);

  const theme = READER_THEMES[prefs.reading.theme];

  const card = "space-y-5";

  const previewFontFamily: React.CSSProperties["fontFamily"] =
    prefs.reading.fontFamily === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : prefs.reading.fontFamily === "sans"
        ? "Arial, Helvetica, sans-serif"
        : "system-ui, sans-serif";

  return (
    <div className="min-h-screen">
      <PageHeader
        tone="dark"
        size="md"
        className="px-4 py-10 lg:px-10"
        eyebrow="— Make it yours"
        title="Settings"
        description="Preferences for reading, notifications, accessibility and your account. They’re saved on this device."
      />

      <div className="mx-auto grid w-full max-w-[1312px] gap-12 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10">
        <div className="space-y-12">
          {/* Reading preferences */}
          <section aria-label="Reading preferences" className={card}>
            <SectionHeader
              title="Reading preferences"
              size="sm"
              as="h2"
              divider
            />

            {/* Font size */}
            <ChoiceGroup
              legend="Default font size"
              value={String(fontIndex)}
              options={FONT_SCALES.map((_, index) => ({
                value: String(index),
                label: FONT_LABELS[index] ?? `Size ${index + 1}`,
              }))}
              onChange={(value) =>
                change((p) => ({
                  ...p,
                  reading: {
                    ...p.reading,
                    fontSizeIndex: getFontIndex(Number(value)),
                  },
                }))
              }
            />

            {/* Font family */}
            <ChoiceGroup<ReaderFontFamily>
              legend="Font family"
              value={prefs.reading.fontFamily}
              options={[
                { value: "serif", label: "Serif" },
                { value: "sans", label: "Sans-serif" },
                { value: "system", label: "System default" },
              ]}
              hint="Choose the lettering style used when reading."
              onChange={(value) =>
                change((p) => ({
                  ...p,
                  reading: {
                    ...p.reading,
                    fontFamily: value,
                  },
                }))
              }
            />

            {/* Reading theme */}
            <ChoiceGroup<ReaderTheme>
              legend="Reading theme"
              value={prefs.reading.theme}
              options={[
                { value: "light", label: "Light" },
                { value: "sepia", label: "Sepia" },
                { value: "dark", label: "Dark" },
                { value: "green", label: "Green" },
              ]}
              onChange={(value) =>
                change((p) => ({
                  ...p,
                  reading: {
                    ...p.reading,
                    theme: value,
                  },
                }))
              }
            />

            {/* Line spacing */}
            <ChoiceGroup<LineSpacing>
              legend="Line spacing"
              value={prefs.reading.lineSpacing}
              options={[
                { value: "compact", label: "Compact" },
                { value: "normal", label: "Normal" },
                { value: "relaxed", label: "Relaxed" },
              ]}
              onChange={(value) =>
                change((p) => ({
                  ...p,
                  reading: {
                    ...p.reading,
                    lineSpacing: value,
                  },
                }))
              }
            />

            {/* Reading layout */}
            <ChoiceGroup<ReadingLayout>
              legend="Default reading layout"
              value={prefs.reading.layout}
              options={[
                { value: "focused", label: "Focused column" },
                { value: "wide", label: "Wide page" },
              ]}
              onChange={(value) =>
                change((p) => ({
                  ...p,
                  reading: {
                    ...p.reading,
                    layout: value,
                  },
                }))
              }
            />
          </section>

          {/* Notifications */}
          <section aria-label="Notifications" className={card}>
            <SectionHeader title="Notifications" size="sm" as="h2" divider />

            <div className="divide-y divide-line">
              <ToggleField
                label="Reading reminders"
                description="A gentle nudge to continue what you’re reading."
                checked={prefs.notifications.readingReminders}
                onChange={(value) =>
                  change((p) => ({
                    ...p,
                    notifications: {
                      ...p.notifications,
                      readingReminders: value,
                    },
                  }))
                }
              />

              <ToggleField
                label="Account notifications"
                description="Changes to your account or organisation access."
                checked={prefs.notifications.accountNotifications}
                onChange={(value) =>
                  change((p) => ({
                    ...p,
                    notifications: {
                      ...p.notifications,
                      accountNotifications: value,
                    },
                  }))
                }
              />

              <ToggleField
                label="System announcements"
                description="Maintenance windows and new features."
                checked={prefs.notifications.systemAnnouncements}
                onChange={(value) =>
                  change((p) => ({
                    ...p,
                    notifications: {
                      ...p.notifications,
                      systemAnnouncements: value,
                    },
                  }))
                }
              />
            </div>

            <p className="m-0 text-[14px] text-muted">
              Your choices are saved now; messages will be delivered once
              notifications are connected to the platform.
            </p>
          </section>

          {/* Accessibility */}
          <section aria-label="Accessibility" className={card}>
            <SectionHeader title="Accessibility" size="sm" as="h2" divider />

            <ChoiceGroup<AppTextSize>
              legend="Text size (whole app)"
              value={prefs.accessibility.textSize}
              options={[
                { value: "default", label: "Default" },
                { value: "large", label: "Large" },
                { value: "larger", label: "Larger" },
              ]}
              hint="Enlarges menus, pages and controls. Book text has its own size above."
              onChange={(value) =>
                change((p) => ({
                  ...p,
                  accessibility: {
                    ...p.accessibility,
                    textSize: value,
                  },
                }))
              }
            />

            <div className="divide-y divide-line">
              <ToggleField
                label="High-contrast reading text"
                description="Pure black or white text on the reading page."
                checked={prefs.accessibility.highContrast}
                onChange={(value) =>
                  change((p) => ({
                    ...p,
                    accessibility: {
                      ...p.accessibility,
                      highContrast: value,
                    },
                  }))
                }
              />

              <ToggleField
                label="Wider letter spacing"
                description="Spaces letters out slightly in the reader."
                checked={prefs.accessibility.letterSpacing}
                onChange={(value) =>
                  change((p) => ({
                    ...p,
                    accessibility: {
                      ...p.accessibility,
                      letterSpacing: value,
                    },
                  }))
                }
              />

              <ToggleField
                label="Reduce motion"
                description="Turns off animations and transitions."
                checked={prefs.accessibility.reduceMotion}
                onChange={(value) =>
                  change((p) => ({
                    ...p,
                    accessibility: {
                      ...p.accessibility,
                      reduceMotion: value,
                    },
                  }))
                }
              />
            </div>
          </section>

          {/* Account preferences */}
          <section aria-label="Account preferences" className={card}>
            <SectionHeader
              title="Account preferences"
              size="sm"
              as="h2"
              divider
            />

            <SelectField
              label="Language"
              value={prefs.account.language}
              options={LANGUAGES}
              hint="Your choice is saved; the interface is currently shown in English."
              onChange={(event) =>
                change((p) => ({
                  ...p,
                  account: {
                    ...p.account,
                    language: event.target.value,
                  },
                }))
              }
            />

            <ChoiceGroup<Landing>
              legend="Open this page first"
              value={prefs.account.landing}
              options={[
                { value: "dashboard", label: "Dashboard" },
                { value: "library", label: "My Library" },
              ]}
              onChange={(value) =>
                change((p) => ({
                  ...p,
                  account: {
                    ...p.account,
                    landing: value,
                  },
                }))
              }
            />

            <p className="m-0 text-[15px] text-muted">
              Looking for your name, email or password? Those are on{" "}
              <Link className="text-brand underline" to={USER_ROUTES.profile}>
                Profile
              </Link>
              .
            </p>

            <Button variant="outline" onClick={() => setConfirmReset(true)}>
              Reset all preferences
            </Button>
          </section>
        </div>

        {/* Reading preview */}
        <aside
          aria-label="Reading preview"
          className="self-start lg:sticky lg:top-24"
        >
          <SectionHeader title="Preview" size="sm" as="h2" divider />

          <div className={cx("mt-4 rounded-[4px] p-4", theme.surface)}>
            <div
              className={cx("px-6 py-8", theme.page, theme.text)}
              style={{
                fontFamily: previewFontFamily,
                fontSize: `${18 * FONT_SCALES[fontIndex]}px`,
                lineHeight: LINE_HEIGHT[prefs.reading.lineSpacing],
                letterSpacing: prefs.accessibility.letterSpacing
                  ? "0.03em"
                  : undefined,
                color: prefs.accessibility.highContrast
                  ? prefs.reading.theme === "light"
                    ? "#000"
                    : "#fff"
                  : undefined,
              }}
            >
              <p className="m-0">
                Attention is not a passive sensory filter; it is the currency
                through which conscious reality is financed.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Reset confirmation */}
      <ConfirmationDialog
        open={confirmReset}
        title="Reset all preferences?"
        description="Reading, notification, accessibility and account preferences return to their defaults."
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);

          setToast(
            reset()
              ? {
                  variant: "success",
                  message: "Preferences reset to defaults.",
                }
              : {
                  variant: "error",
                  message:
                    "Reset for this visit only – your browser blocked storage.",
                },
          );
        }}
      />

      {/* Feedback notification */}
      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default Settings;
