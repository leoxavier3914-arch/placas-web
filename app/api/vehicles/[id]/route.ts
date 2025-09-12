import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';
import { getCompanyId } from '@/lib/env';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    const companyId = getCompanyId();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .update({ plate, model: model || null, color: color || null })
      .eq('company_id', companyId)
      .eq('id', params.id)
      .select('id, plate, model, color')
      .single();
    if (error) {
      if ((error as any).code === '23505') {
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId();
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('company_id', companyId)
      .eq('id', params.id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado no servidor.' },
      { status: 500 }
    );
  }
}
