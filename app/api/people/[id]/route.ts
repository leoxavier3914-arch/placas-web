import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import env from '@/lib/env';
import { z } from 'zod';
import { parseJsonSafe } from '@/lib/api';
import { getValidationErrorMsg } from '@/lib/validation';

const schema = z.object({
  photo_url: z.string().url().nullish(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await parseJsonSafe(req).catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: getValidationErrorMsg(parsed) },
        { status: 400 }
      );
    }
    const { photo_url } = parsed.data;

    const companyId = env.COMPANY_ID;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('people')
      .update({ photo_url: photo_url || null })
      .eq('company_id', companyId)
      .eq('id', params.id)
      .select('id, full_name, doc_number, phone, email, notes, photo_url')
      .single();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado no servidor.' },
      { status: 500 }
    );
  }
}
