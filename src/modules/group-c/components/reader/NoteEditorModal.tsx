import { useCallback, useEffect, useRef, useState } from "react";
import { TextAreaField } from "../user/FormFields";
import { Button, Modal } from "../user/sharedUi";

export interface NoteEditorModalProps {
  open: boolean;
  title: string;
  /** Passage the note is attached to (shown for context). */
  quote?: string;
  initialText?: string;
  onSave: (text: string) => Promise<void>;
  onClose: () => void;
}

const MAX = 2000;

/** Create or edit a note with validation. */
export function NoteEditorModal({
  open,
  title,
  quote,
  initialText = "",
  onSave,
  onClose,
}: NoteEditorModalProps) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setError(undefined);
    }
  }, [open, initialText]);

  // Keep these in refs so handleClose keeps the same identity between renders.
  // The shared Modal re-runs its focus effect whenever onClose changes, which
  // would pull focus out of the textarea after every typed character.
  const onCloseRef = useRef(onClose);
  const savingRef = useRef(saving);
  onCloseRef.current = onClose;
  savingRef.current = saving;

  const handleClose = useCallback(() => {
    if (!savingRef.current) {
      onCloseRef.current();
    }
  }, []);

  const submit = async () => {
    const value = text.trim();

    if (!value) {
      setError("Write something before saving.");
      return;
    }

    if (value.length > MAX) {
      setError(`Notes can be up to ${MAX} characters.`);
      return;
    }

    setSaving(true);
    setError(undefined);

    try {
      await onSave(value);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your note. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      dismissible={!saving}
      actions={
        <>
          <Button
            type="button"
            variant="text"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button type="button" onClick={() => void submit()} disabled={saving}>
            {saving ? "Saving..." : "Save note"}
          </Button>
        </>
      }
    >
      {quote && (
        <blockquote className="m-0 mb-4 border-l-2 border-line pl-3 font-serif text-[17px] italic text-ink/85">
          “{quote}”
        </blockquote>
      )}

      <TextAreaField
        label="Your note"
        value={text}
        error={error}
        hint={`${text.length} / ${MAX} characters`}
        maxLength={MAX}
        disabled={saving}
        autoFocus
        onChange={(event) => {
          setText(event.target.value);
          setError(undefined);
        }}
      />
    </Modal>
  );
}
