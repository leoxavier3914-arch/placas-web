import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // First, try to find a vehicle with the given plate
  const { data: vehicle, error: vehicleErr } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('company_id', companyId)
    .eq('plate', plate)
    .maybeSingle();

  if (vehicleErr)
    return NextResponse.json({ ok: false, error: vehicleErr.message }, { status: 400 });

  if (vehicle) {
    // Fetch all people linked to this vehicle (if any)
    const { data: vpList, error: vpErr } = await supabaseAdmin
      .from('vehicle_people')
      .select('people:people (id, full_name)')
      .eq('company_id', companyId)
      .eq('vehicle_id', vehicle.id);

    if (vpErr)
      return NextResponse.json({ ok: false, error: vpErr.message }, { status: 400 });

    const people =
      vpList?.map((vp: any) => vp.people).filter((p: any) => p) || [];

    return NextResponse.json({ type: 'registered', vehicle, people });
  }

  // Not registered: check if the plate is authorized
  const { data: authorized, error: authErr } = await supabaseAdmin
    .from('authorized')
    .select('plate, name, department')
    .eq('company_id', companyId)
    .eq('plate', plate)
    .maybeSingle();

  if (authErr)
    return NextResponse.json({ ok: false, error: authErr.message }, { status: 400 });

  if (authorized) {
    return NextResponse.json({ type: 'authorized', authorized });
  }

  // Plate not found anywhere
  return NextResponse.json({ type: 'none' });
}
