import { useEffect } from 'react';

/** Shared behavior for menus and dialogs that should close on an outside click. */
export default function useClickOutside(elementRef, onOutsideClick) {
  useEffect(() => {
    function handlePointerDown(event) {
      if (elementRef.current && !elementRef.current.contains(event.target)) {
        onOutsideClick();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [elementRef, onOutsideClick]);
}
