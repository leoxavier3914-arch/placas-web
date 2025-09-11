import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Requisição inválida (corpo ausente ou inválido).' },
        { status: 400 }
      );
    }

    const full_name: string | undefined = body?.full_name?.trim();
    const doc_number: string | null = body?.doc_number ?? null;
    const phone: string | null = body?.phone ?? null;
    const email: string | null = body?.email ?? null;
    const notes: string | null = body?.notes ?? null;

    if (!full_name) {
      return NextResponse.json({ ok: false, error: 'Nome completo é obrigatório.' }, { status: 400 });
    }

    const companyId = process.env.COMPANY_ID!;
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
