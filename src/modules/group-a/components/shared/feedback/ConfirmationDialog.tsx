import type { ReactNode } from 'react';
import { Button } from '../buttons/Button';
import { Modal } from './Modal';

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` styles the confirm action for destructive operations. */
  tone?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'default', loading, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      role="alertdialog"
      dismissible={!loading}
      actions={
        <>
          <Button variant="text" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    />
  );
}
