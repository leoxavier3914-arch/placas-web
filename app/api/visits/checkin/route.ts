import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const body = await req.json();
  const { personId, vehicleId, purpose } = body;
  const companyId = process.env.COMPANY_ID;
  if (!companyId) {
    console.error('COMPANY_ID not configured');
    return NextResponse.json(
      { ok: false, error: 'COMPANY_ID not configured' },
      { status: 500 }
    );
  }
  const branchId = process.env.DEFAULT_BRANCH_ID!;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('visits')
    .insert({
      company_id: companyId,
      branch_id: branchId,
      person_id: personId ?? null,
      vehicle_id: vehicleId ?? null,
      purpose: purpose ?? 'despacho',
      created_by: null
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await supabaseAdmin.from('visit_events').insert({
    visit_id: data.id,
    type: 'checkin',
    meta: {}
  });

  return NextResponse.json({ ok: true, visit: data });
}
