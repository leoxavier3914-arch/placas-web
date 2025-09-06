import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Requisição inválida (corpo ausente ou inválido).' },
        { status: 400 }
      );
    }

    const plateRaw: string | undefined = body?.plate;
    const model: string | null = body?.model ?? null;
    const color: string | null = body?.color ?? null;

    const plate = normalizePlate(plateRaw ?? '');
    if (!plate) {
      return NextResponse.json({ ok: false, error: 'Placa inválida.' }, { status: 400 });
    }

    const companyId = process.env.COMPANY_ID!;
    const insert = {
      company_id: companyId,
      plate,
      model: model || null,
      color: color || null,
    };

    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .insert(insert)
      .select()
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        // unique_violation na (company_id, plate)
        const msg = 'Esta placa já está cadastrada nesta empresa.';
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
