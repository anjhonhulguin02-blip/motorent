import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  );
}

// Makes everything outside `target` unreachable to mouse/keyboard/assistive
// tech by walking up to <body> and marking every sibling along the way as
// `inert`. Works at any nesting depth and layers correctly when a second
// modal (e.g. the login modal) opens on top of one that's still mounted —
// each call only inerts what wasn't already inert, and only restores that.
function inertOutside(target) {
  const restored = [];
  let node = target;
  while (node && node !== document.body && node.parentElement) {
    const parent = node.parentElement;
    Array.from(parent.children).forEach((sibling) => {
      if (sibling !== node && !sibling.inert) {
        sibling.inert = true;
        restored.push(sibling);
      }
    });
    node = parent;
  }
  return () => restored.forEach((el) => { el.inert = false; });
}

// Full modal accessibility contract in one hook: locks body scroll, moves
// focus into the dialog on open, traps Tab/Shift+Tab inside it, hides the
// rest of the page from assistive tech via `inert`, and restores focus to
// whatever triggered the modal once it closes.
export default function useModalA11y(isActive, dialogRef) {
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !dialogRef.current) return;

    triggerRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const restoreInert = inertOutside(dialogRef.current);

    const focusables = getFocusable(dialogRef.current);
    (focusables[0] || dialogRef.current).focus();

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable(dialogRef.current);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreInert();
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus?.();
    };
  }, [isActive, dialogRef]);
}
