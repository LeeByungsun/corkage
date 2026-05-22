import { fetchServerMvpState } from './server-state-client';
import type { CorkageStore } from '../types/corkage';

export async function readCanonicalOverrides(): Promise<CorkageStore[]> {
  const state = await fetchServerMvpState();
  return state.canonicalOverrides;
}
