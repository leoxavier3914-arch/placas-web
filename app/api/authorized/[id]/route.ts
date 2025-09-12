import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';
import { getCompanyId } from '@/lib/env';
import { ensurePerson, ensureVehicle } from '@/lib/ensure';

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

    const plate = normalizePlate(body?.plate ?? '');
    const name: string | undefined = body?.name?.trim();
    const department: string | undefined = body?.department?.trim();
    const model: string | null = body?.model?.trim() || null;
    const color: string | null = body?.color?.trim() || null;

    if (!plate || !name || !department) {
      return NextResponse.json(
        { ok: false, error: 'Placa, nome e departamento são obrigatórios.' },
        { status: 400 }
      );
    }

    const companyId = getCompanyId();
    const supabaseAdmin = getSupabaseAdmin();

    let personId: string;
    try {
      personId = await ensurePerson(supabaseAdmin, companyId, name);
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }

    let vehicleId: string;
    try {
      vehicleId = await ensureVehicle(
        supabaseAdmin,
        companyId,
        plate,
        model,
        color
      );
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('authorized')
      .update({ plate, name, department })
      .eq('id', params.id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json(
          { ok: false, error: 'Esta placa já está autorizada.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: { ...data, personId, vehicleId } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado no servidor.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId();
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('authorized')
      .delete()
      .eq('id', params.id)
      .eq('company_id', companyId);

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

