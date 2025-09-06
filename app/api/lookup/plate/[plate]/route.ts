import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';

export async function GET(_: Request, { params }: { params: { plate: string } }) {
  const plate = normalizePlate(params.plate);

  const { data: vehicle, error: vehErr } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('company_id', process.env.COMPANY_ID)
    .eq('plate', plate)
    .maybeSingle();

  if (vehErr) return NextResponse.json({ ok: false, error: vehErr.message }, { status: 400 });
  if (!vehicle) return NextResponse.json({ found: false });

  const person = null;

  const { data: visits, error: visErr } = await supabaseAdmin
    .from('visits')
    .select('id, checkin_time, checkout_time')
    .eq('company_id', process.env.COMPANY_ID)
    .eq('branch_id', process.env.DEFAULT_BRANCH_ID)
    .eq('vehicle_id', vehicle.id)
    .order('checkin_time', { ascending: false })
    .limit(20);

  if (visErr) return NextResponse.json({ ok: false, error: visErr.message }, { status: 400 });

  return NextResponse.json({ found: true, vehicle, person, visits });
}
