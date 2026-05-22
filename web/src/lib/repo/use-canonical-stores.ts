'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAllStores, mergeStores } from './corkage-repo';
import { readCanonicalOverrides } from './canonical-overrides';
import type { CorkageStore } from '../types/corkage';

export function useCanonicalStores() {
  const [overrides, setOverrides] = useState<CorkageStore[]>([]);

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const nextOverrides = await readCanonicalOverrides();

        if (active) {
          setOverrides(nextOverrides);
        }
      } catch {
        if (active) {
          setOverrides([]);
        }
      }
    }

    void sync();

    return () => {
      active = false;
    };
  }, []);

  return useMemo(
    () => mergeStores(getAllStores(), overrides),
    [overrides],
  );
}
