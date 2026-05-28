import React from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  open: boolean;
  children: React.ReactNode;
  onBackdropClick?: () => void;
}

/** Renders modal overlay at document.body so sticky table/header z-index cannot bleed through. */
const ModalPortal: React.FC<ModalPortalProps> = ({ open, children, onBackdropClick }) => {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-hidden
        onClick={onBackdropClick}
      />
      <div className="relative z-10 w-full flex items-center justify-center">{children}</div>
    </div>,
    document.body
  );
};

export default ModalPortal;
