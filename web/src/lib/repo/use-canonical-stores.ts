'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAllStores, mergeStores } from './corkage-repo';
import { readCanonicalOverrides } from './canonical-overrides';
import type { CorkageStore } from '../types/corkage';

const EMPTY_INITIAL_STORES: CorkageStore[] = getAllStores();

export function useCanonicalStores(initialStores: CorkageStore[] = EMPTY_INITIAL_STORES) {
  const [baseStores, setBaseStores] = useState<CorkageStore[]>(initialStores);
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

  useEffect(() => {
    let active = true;

    async function syncStores() {
      try {
        const response = await fetch('/api/stores');

        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }

        const payload = (await response.json()) as { stores?: CorkageStore[] };

        if (active) {
          setBaseStores(Array.isArray(payload.stores) ? payload.stores : []);
        }
      } catch {
        if (active && initialStores.length > 0) {
          setBaseStores(initialStores);
        }
      }
    }

    void syncStores();

    return () => {
      active = false;
    };
  }, [initialStores]);

  return useMemo(
    () => mergeStores(baseStores, overrides),
    [baseStores, overrides],
  );
}
