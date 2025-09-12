import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyId } from '@/lib/env';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  const companyId = getCompanyId();
  const branchId = process.env.DEFAULT_BRANCH_ID;

  if (!branchId) {
    return NextResponse.json(
      { ok: false, error: 'DEFAULT_BRANCH_ID not configured' },
      { status: 500 }
    );
  }

  const { data: visit, error: visitError } = await supabaseAdmin
    .from('visits')
    .select('company_id, branch_id')
    .eq('id', params.id)
    .single();

  if (visitError || !visit) {
    return NextResponse.json(
      { ok: false, error: visitError?.message ?? 'Visit not found' },
      { status: 404 }
    );
  }

  if (visit.company_id !== companyId || visit.branch_id !== branchId) {
    return NextResponse.json(
      { ok: false, error: 'Visit does not belong to current organization' },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('visits')
    .update({ checkout_time: new Date().toISOString() })
    .eq('id', params.id)
    .eq('company_id', companyId)
    .eq('branch_id', branchId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await supabaseAdmin.from('visit_events').insert({
    visit_id: params.id,
    type: 'checkout',
    meta: {},
  });

  return NextResponse.json({ ok: true, visit: data });
}
