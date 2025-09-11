import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';


export const revalidate = 0;
export const dynamic = 'force-dynamic';


export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const companyId = process.env.COMPANY_ID!;
  const branchId = process.env.DEFAULT_BRANCH_ID!;

  const { data, error } = await supabaseAdmin
    .from('visits')
    .select('id, checkin_time, people(full_name), vehicles(plate)')
    .eq('company_id', companyId)
    .eq('branch_id', branchId)
    .is('checkout_time', null)
    .order('checkin_time', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}
