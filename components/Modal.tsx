
import React, { useRef, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }
  
  const confirmButtonClasses = isDestructive
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-bg-accent text-text-on-accent hover:bg-bg-accent-hover';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-modal-backdrop backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-sm m-4 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="document"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-xl font-bold text-text-primary mb-4">{title}</h2>
          <div className="text-text-secondary">{children}</div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 bg-bg-tertiary/50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-primary hover:bg-bg-tertiary-hover transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${confirmButtonClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
