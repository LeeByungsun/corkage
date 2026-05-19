'use client';

import type { CorkageStore } from '../types/corkage';

export const CANONICAL_OVERRIDES_STORAGE_KEY =
  'corkage-mvp-canonical-overrides';

export const CANONICAL_OVERRIDES_UPDATED_EVENT =
  'corkage:canonical-overrides-updated';

export function readCanonicalOverrides(): CorkageStore[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(CANONICAL_OVERRIDES_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CorkageStore[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(CANONICAL_OVERRIDES_STORAGE_KEY);
    return [];
  }
}

export function saveCanonicalOverride(store: CorkageStore): CorkageStore[] {
  const current = readCanonicalOverrides();
  const next = upsertCanonicalOverride(current, store);
  persistCanonicalOverrides(next);
  return next;
}

export function upsertCanonicalOverride(
  overrides: CorkageStore[],
  store: CorkageStore,
): CorkageStore[] {
  const filtered = overrides.filter(
    (item) => item.placeId !== store.placeId,
  );

  return [store, ...filtered];
}

function persistCanonicalOverrides(overrides: CorkageStore[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    CANONICAL_OVERRIDES_STORAGE_KEY,
    JSON.stringify(overrides),
  );

  window.dispatchEvent(
    new CustomEvent(CANONICAL_OVERRIDES_UPDATED_EVENT, {
      detail: {
        count: overrides.length,
      },
    }),
  );
}
