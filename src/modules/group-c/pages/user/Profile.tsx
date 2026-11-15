import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { TextField } from "../../components/user/FormFields";

import {
  Alert,
  Button,
  LoadingIndicator,
  SectionHeader,
  ToastNotification,
  UserAvatar,
} from "../../components/user/sharedUi";

import {
  changePassword,
  getProfile,
  updateProfile,
} from "../../services/profile.service";

import type { ProfileData } from "../../types/reader.types";

/**
 * User Profile (Group C).
 *
 * Route: /user/profile
 *
 * The user can:
 * - View their profile information.
 * - Update their full name.
 * - Change their password.
 *
 * Email is managed by the authentication system
 * and cannot be edited on this page.
 */
export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();

  const [savingName, setSavingName] = useState(false);

  const [password, setPassword] = useState({
    next: "",
    confirm: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<{
    next?: string;
    confirm?: string;
  }>({});

  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Prevent an older profile request from overwriting newer state.
  const requestId = useRef(0);

  /**
   * Loads the current user's profile.
   */
  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;

    setLoading(true);
    setLoadError(false);

    try {
      const result = await getProfile();

      if (currentRequest !== requestId.current) return;

      setProfile(result);
      setName(result.fullName);
      setNameError(undefined);
    } catch {
      if (currentRequest !== requestId.current) return;

      setLoadError(true);
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();

    return () => {
      requestId.current += 1;
    };
  }, [load]);

  /**
   * Saves the user's full name.
   */
  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Enter your full name.");
      return;
    }

    if (trimmedName.length > 100) {
      setNameError("Keep your name under 100 characters.");
      return;
    }

    if (!profile || trimmedName === profile.fullName) {
      return;
    }

    setNameError(undefined);
    setSavingName(true);

    try {
      const updatedProfile = await updateProfile(trimmedName);

      setProfile(updatedProfile);
      setName(updatedProfile.fullName);

      setToast({
        variant: "success",
        message: "Profile updated successfully.",
      });
    } catch {
      setToast({
        variant: "error",
        message: "We couldn’t update your profile. Please try again.",
      });
    } finally {
      setSavingName(false);
    }
  };

  /**
   * Validates and changes the user's password.
   */
  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: {
      next?: string;
      confirm?: string;
    } = {};

    if (!password.next) {
      errors.next = "Enter a new password.";
    } else if (password.next.length < 8) {
      errors.next = "Use at least 8 characters.";
    }

    if (!password.confirm) {
      errors.confirm = "Confirm your new password.";
    } else if (password.confirm !== password.next) {
      errors.confirm = "Passwords don’t match.";
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword(password.next);

      setPassword({
        next: "",
        confirm: "",
      });

      setPasswordErrors({});

      setToast({
        variant: "success",
        message: "Your password has been changed successfully.",
      });
    } catch (error) {
      setToast({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "We couldn’t change your password. Please try again.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <LoadingIndicator
        centered
        size="lg"
        label="Loading profile…"
        className="min-h-screen"
      />
    );
  }

  // Error state
  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16">
        <Alert
          severity="error"
          title="We couldn’t load your profile"
          action={
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-10 lg:px-0">
      {/* Profile heading */}
      <div className="flex items-center gap-4">
        <UserAvatar
          name={profile.fullName}
          imageUrl={profile.avatarUrl ?? undefined}
          size="lg"
        />

        <div className="min-w-0">
          <h1 className="m-0 font-serif text-[32px] font-medium text-deep">
            {profile.fullName}
          </h1>

          <p className="m-0 break-words text-[16px] text-muted">
            {profile.email}

            {profile.organisationName && ` · ${profile.organisationName}`}
          </p>
        </div>
      </div>

      {/* Personal details */}
      <form onSubmit={saveName} noValidate className="mt-10 space-y-4">
        <SectionHeader title="Personal details" size="sm" as="h2" divider />

        <TextField
          label="Full name"
          value={name}
          error={nameError}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(undefined);
          }}
          autoComplete="name"
        />

        <TextField
          label="Email"
          value={profile.email}
          disabled
          readOnly
          hint="Your email is managed by your organisation’s sign-in."
        />

        <Button
          type="submit"
          disabled={savingName || name.trim() === profile.fullName}
        >
          {savingName ? "Saving…" : "Save changes"}
        </Button>
      </form>

      {/* Change password */}
      <form onSubmit={savePassword} noValidate className="mt-12 space-y-4">
        <SectionHeader title="Change password" size="sm" as="h2" divider />

        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password.next}
          error={passwordErrors.next}
          onChange={(event) => {
            setPassword((current) => ({
              ...current,
              next: event.target.value,
            }));

            setPasswordErrors((current) => ({
              ...current,
              next: undefined,
            }));
          }}
        />

        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={password.confirm}
          error={passwordErrors.confirm}
          onChange={(event) => {
            setPassword((current) => ({
              ...current,
              confirm: event.target.value,
            }));

            setPasswordErrors((current) => ({
              ...current,
              confirm: undefined,
            }));
          }}
        />

        <Button type="submit" disabled={savingPassword}>
          {savingPassword ? "Updating…" : "Update password"}
        </Button>
      </form>

      {/* Feedback */}
      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default Profile;
