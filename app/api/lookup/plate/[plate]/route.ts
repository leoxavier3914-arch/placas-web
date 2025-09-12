import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';
import env from '@/lib/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_: Request, { params }: { params: { plate: string } }) {
  const plate = normalizePlate(params.plate);
  if (!plate) {
    return NextResponse.json(
      { ok: false, error: 'Placa inválida.' },
      { status: 400 }
    );
  }
  const companyId = env.COMPANY_ID;
  if (env.NODE_ENV !== 'production') {
    console.log('lookup', companyId, plate);
  }

  const supabaseAdmin = getSupabaseAdmin();


  // Query vehicle with related people and authorized plate in parallel
  const [{ data: vehicle, error: vehicleErr }, { data: authorized, error: authErr }] =
    await Promise.all([
      supabaseAdmin
        .from('vehicles')
        .select('id, plate, model, color, vehicle_people(people(id, full_name))')
        .eq('company_id', companyId)
        .eq('plate', plate)
        .maybeSingle(),
      supabaseAdmin
        .from('authorized')
        .select('plate, name, department')
        .eq('company_id', companyId)
        .eq('plate', plate)
        .maybeSingle(),
    ]);


  if (vehicleErr)
    return NextResponse.json({ ok: false, error: vehicleErr.message }, { status: 400 });

  if (vehicle) {
    const people =
      vehicle.vehicle_people?.map((vp: any) => vp.people).filter((p: any) => p) || [];
    const { vehicle_people, ...vehicleData } = vehicle;
    return NextResponse.json({ type: 'registered', vehicle: vehicleData, people });
  }

  if (authErr)
    return NextResponse.json({ ok: false, error: authErr.message }, { status: 400 });

  if (authorized) {
    return NextResponse.json({ type: 'authorized', authorized });
  }

  // Plate not found anywhere
  return NextResponse.json({ type: 'none' });
}
