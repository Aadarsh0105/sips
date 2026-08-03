import { useEffect, useRef, useState } from 'react';

let activeMenuId: string | null = null;
const listeners = new Set<(id: string | null) => void>();

function setActiveMenuId(id: string | null) {
  activeMenuId = id;
  listeners.forEach((listener) => listener(activeMenuId));
}

export function useExclusiveMenu(menuId: string) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = (id: string | null) => setOpen(id === menuId);
    listeners.add(sync);
    sync(activeMenuId);
    return () => {
      listeners.delete(sync);
      if (activeMenuId === menuId) {
        setActiveMenuId(null);
      }
    };
  }, [menuId]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!open) return;
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  const toggle = () => {
    setActiveMenuId(activeMenuId === menuId ? null : menuId);
  };

  const close = () => {
    if (activeMenuId === menuId) {
      setActiveMenuId(null);
    }
  };

  return { rootRef, open, toggle, close };
}
