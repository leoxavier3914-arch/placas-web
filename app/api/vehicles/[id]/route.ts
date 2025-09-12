import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';
import env from '@/lib/env';
import { z } from 'zod';
import { parseJsonSafe } from '@/lib/api';

const vehicleSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, 'Placa é obrigatória.')
    .refine((val) => !!normalizePlate(val), 'Placa inválida.')
    .transform((val) => normalizePlate(val)!),
  model: z.string().trim().nullish(),
  color: z.string().trim().nullish(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await parseJsonSafe(req).catch(() => null);
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      const invalid =
        parsed.error.errors.length === 1 &&
        parsed.error.errors[0].path.length === 0;
      const msg = invalid
        ? 'Requisição inválida (corpo ausente ou inválido).'
        : parsed.error.errors.map((e) => e.message).join(' ');
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    const { plate, model, color } = parsed.data;

    const companyId = env.COMPANY_ID;
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
    const companyId = env.COMPANY_ID;
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
