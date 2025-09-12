import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyId } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { personId, vehicleId, purpose } = body;
    const companyId = getCompanyId();
    const branchId = process.env.DEFAULT_BRANCH_ID;

    if (!branchId) {
      return NextResponse.json({ ok: false, error: 'DEFAULT_BRANCH_ID not configured' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (vehicleId) {
      const { data: openVisits, error: openVisitsError } = await supabaseAdmin
        .from('visits')
        .select('id')
        .eq('company_id', companyId)
        .eq('branch_id', branchId)
        .eq('vehicle_id', vehicleId)
        .is('checkout_time', null)
        .limit(1);

      if (openVisitsError) {
        return NextResponse.json({ ok: false, error: openVisitsError.message }, { status: 400 });
      }

      if (openVisits && openVisits.length > 0) {
        return NextResponse.json({ ok: false, error: 'Vehicle already has an open visit' }, { status: 400 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('visits')
      .insert({
        company_id: companyId,
        branch_id: branchId,
        person_id: personId ?? null,
        vehicle_id: vehicleId ?? null,
        purpose: purpose ?? 'despacho',
        created_by: null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    const { error: eventError } = await supabaseAdmin.from('visit_events').insert({
      visit_id: data.id,
      type: 'checkin',
      meta: {},
    });

    if (eventError) {
      return NextResponse.json({ ok: false, error: eventError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, visit: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

