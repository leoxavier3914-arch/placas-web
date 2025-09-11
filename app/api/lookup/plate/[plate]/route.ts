import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';

export async function GET(_: Request, { params }: { params: { plate: string } }) {
  const plate = normalizePlate(params.plate);
  const companyId = process.env.COMPANY_ID;
  console.log('lookup', companyId, plate);
  if (!companyId) {
    console.error('COMPANY_ID not configured');
    return NextResponse.json(
      { ok: false, error: 'COMPANY_ID not configured' },
      { status: 500 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: vpeople, error: vpErr } = await supabaseAdmin
    .from('vehicle_people')
    .select('vehicle:vehicles (*), people:people (id, full_name)')
    .eq('company_id', companyId)
    .eq('vehicle.plate', plate);

  if (vpErr) return NextResponse.json({ ok: false, error: vpErr.message }, { status: 400 });

  if (!vpeople || vpeople.length === 0)
    return NextResponse.json({ type: 'none' });

  const vehicle = vpeople[0].vehicle;
  const people = vpeople.map((vp: any) => vp.people).filter((p: any) => p);

  return NextResponse.json({ type: 'registered', vehicle, people });
}
