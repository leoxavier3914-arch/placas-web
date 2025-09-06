import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('visits')
    .update({ checkout_time: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await supabaseAdmin.from('visit_events').insert({
    visit_id: params.id,
    type: 'checkout',
    meta: {}
  });

  return NextResponse.json({ ok: true, visit: data });
}
