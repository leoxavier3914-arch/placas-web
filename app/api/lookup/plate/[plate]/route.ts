import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';

export async function GET(_: Request, { params }: { params: { plate: string } }) {
  const plate = normalizePlate(params.plate);

  const supabaseAdmin = getSupabaseAdmin();
  const { data: vehicle, error: vehErr } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('company_id', process.env.COMPANY_ID)
    .eq('plate', plate)
    .maybeSingle();

  if (vehErr) return NextResponse.json({ ok: false, error: vehErr.message }, { status: 400 });
  if (vehicle) {
    const { data: visits, error: visErr } = await supabaseAdmin
      .from('visits')
      .select('id, checkin_time, checkout_time')
      .eq('company_id', process.env.COMPANY_ID)
      .eq('branch_id', process.env.DEFAULT_BRANCH_ID)
      .eq('vehicle_id', vehicle.id)
      .order('checkin_time', { ascending: false })
      .limit(20);

    if (visErr) return NextResponse.json({ ok: false, error: visErr.message }, { status: 400 });

    const { data: vpeople, error: vpErr } = await supabaseAdmin
      .from('vehicle_people')
      .select('people:people (id, full_name)')
      .eq('company_id', process.env.COMPANY_ID)
      .eq('vehicle_id', vehicle.id);

    if (vpErr)
      return NextResponse.json({ ok: false, error: vpErr.message }, { status: 400 });

    const people =
      vpeople?.map((vp: any) => vp.people).filter((p: any) => p) || [];

    return NextResponse.json({ type: 'registered', vehicle, visits, people });
  }

  const { data: auth, error: authErr } = await supabaseAdmin
    .from('authorized')
    .select('plate, name, department')
    .eq('company_id', process.env.COMPANY_ID)
    .eq('plate', plate)
    .maybeSingle();

  if (authErr) return NextResponse.json({ ok: false, error: authErr.message }, { status: 400 });
  if (auth) return NextResponse.json({ type: 'authorized', authorized: auth });

  return NextResponse.json({ type: 'none' });
}
