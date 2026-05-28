import { NextResponse } from 'next/server';
import {
  listCanonicalDistricts,
  readCanonicalStores,
} from '../../../lib/server/canonical-store-service';
import type { StoreFilterStatus } from '../../../lib/types/corkage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = (url.searchParams.get('status') ?? 'all') as StoreFilterStatus;
  const district = url.searchParams.get('district') ?? 'all';
  const rawMaxFee = Number(url.searchParams.get('maxFee') ?? '');
  const maxFee = Number.isFinite(rawMaxFee) && rawMaxFee > 0 ? rawMaxFee : undefined;

  const stores = await readCanonicalStores({ status, district, maxFee });

  return NextResponse.json({
    stores,
    districts: listCanonicalDistricts(),
  });
}
