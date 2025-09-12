import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
 
import { getCompanyId } from '@/lib/env';
import { getValidationErrorMsg } from '@/lib/validation';

import env from '@/lib/env';
 
import { z } from 'zod';
import { parseJsonSafe } from '@/lib/api';

const personSchema = z.object({
  full_name: z.string().trim().min(1, 'Nome completo é obrigatório.'),
  doc_number: z.string().trim().nullish(),
  phone: z.string().trim().nullish(),
  email: z.string().trim().nullish(),
  notes: z.string().trim().nullish(),
});

export async function GET() {
  try {
    const companyId = env.COMPANY_ID;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('people')
      .select('id, full_name, doc_number, phone, email, notes')
      .eq('company_id', companyId)
      .order('full_name');
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

export async function POST(req: Request) {
  try {
    const body = await parseJsonSafe(req).catch(() => null);
    const parsed = personSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: getValidationErrorMsg(parsed) },
        { status: 400 }
      );
    }

    const { full_name, doc_number, phone, email, notes } = parsed.data;

    const companyId = env.COMPANY_ID;
    const insert = {
      company_id: companyId,
      full_name,
      doc_number: doc_number || null,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
      // se sua tabela tiver defaults para doc_type/doc_country (ex.: 'CPF'/'BR'), deixe que o banco aplique
    };

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('people')
      .insert(insert)
      .select()
      .single();

    if (error) {
      // 23505 = unique_violation (Postgres)
      if ((error as any).code === '23505') {
        // mensagem amigável
        const msg =
          'Já existe uma pessoa cadastrada com este documento nesta empresa.';
        return NextResponse.json({ ok: false, error: msg }, { status: 409 });
      }
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
