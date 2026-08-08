import { useEffect } from 'react';

// Closes a modal when the user presses Escape — standard accessibility
// expectation for any dialog, and lets keyboard-only users leave without
// having to tab to a close button.
export default function useEscapeToClose(isActive, onClose) {
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onClose]);
}
