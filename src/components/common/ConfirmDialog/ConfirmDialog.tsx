import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Button from '../Button/Button';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) => {
  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const modalContent = (
    <div className="confirm-dialog__backdrop" onClick={handleBackdropClick}>
      <div className={`confirm-dialog confirm-dialog--${variant}`}>
        <div className="confirm-dialog__header">
          <h3 className="confirm-dialog__title">{title}</h3>
        </div>
        <div className="confirm-dialog__body">
          {typeof message === 'string' ? (
            <p className="confirm-dialog__message">{message}</p>
          ) : (
            <div className="confirm-dialog__message">{message}</div>
          )}
        </div>
        <div className="confirm-dialog__footer">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            className="confirm-dialog__cancel-btn"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            className="confirm-dialog__confirm-btn"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  // Render modal at document body level to avoid z-index issues
  return createPortal(modalContent, document.body);
};

export default ConfirmDialog;
