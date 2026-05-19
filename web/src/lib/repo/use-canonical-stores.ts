'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAllStores, mergeStores } from './corkage-repo';
import {
  CANONICAL_OVERRIDES_STORAGE_KEY,
  CANONICAL_OVERRIDES_UPDATED_EVENT,
  readCanonicalOverrides,
} from './canonical-overrides';
import type { CorkageStore } from '../types/corkage';

export function useCanonicalStores() {
  const [overrides, setOverrides] = useState<CorkageStore[]>([]);

  useEffect(() => {
    const sync = () => {
      setOverrides(readCanonicalOverrides());
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key &&
        event.key !== CANONICAL_OVERRIDES_STORAGE_KEY
      ) {
        return;
      }

      sync();
    };

    sync();
    window.addEventListener(CANONICAL_OVERRIDES_UPDATED_EVENT, sync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(CANONICAL_OVERRIDES_UPDATED_EVENT, sync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return useMemo(
    () => mergeStores(getAllStores(), overrides),
    [overrides],
  );
}
