import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const full_name: string | undefined = body?.full_name?.trim();
    const doc_number: string | null = body?.doc_number ?? null;
    const phone: string | null = body?.phone ?? null;
    const email: string | null = body?.email ?? null;
    const notes: string | null = body?.notes ?? null;

    if (!full_name) {
      return NextResponse.json({ ok: false, error: 'Nome completo é obrigatório' }, { status: 400 });
    }

    const companyId = process.env.COMPANY_ID!;
    const insert = {
      company_id: companyId,
      full_name,
      doc_number: doc_number || null,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from('people')
      .insert(insert)
      .select()
      .single();

    if (error) {
      // conflito de unique (documento já cadastrado) ou outros
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Erro inesperado' }, { status: 500 });
  }
}
