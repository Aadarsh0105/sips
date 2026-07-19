

import React from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true








}: {open: boolean;onClose: () => void;onConfirm: () => void;title: string;message: string;confirmLabel?: string;danger?: boolean;}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
      <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}>
          
            {confirmLabel}
          </Button>
        </>
      }>
      
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15">
          <AlertTriangleIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        </div>
      </div>
    </Modal>);

}