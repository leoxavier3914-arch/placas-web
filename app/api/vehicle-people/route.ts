import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import env from '@/lib/env';
import { z } from 'zod';
import { parseJsonSafe } from '@/lib/api';

const vehiclePeopleSchema = z.object({
  vehicleId: z.string().trim().min(1, 'vehicleId é obrigatório.'),
  personId: z.string().trim().min(1, 'personId é obrigatório.'),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    const companyId = env.COMPANY_ID;
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('vehicle_people')
      .select('vehicle_id, person_id, people:people (id, full_name)')
      .eq('company_id', companyId);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);
    const { data, error } = await query;
    if (error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    const list =
      data?.map((row: any) => ({
        vehicleId: row.vehicle_id,
        personId: row.person_id,
        person: row.people,
      })) || [];
    return NextResponse.json({ ok: true, data: list });
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
    const parsed = vehiclePeopleSchema.safeParse(body);
    if (!parsed.success) {
      const invalid =
        parsed.error.errors.length === 1 &&
        parsed.error.errors[0].path.length === 0;
      const msg = invalid
        ? 'Requisição inválida (corpo ausente ou inválido).'
        : parsed.error.errors.map((e) => e.message).join(' ');
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    const { vehicleId, personId } = parsed.data;
    const companyId = env.COMPANY_ID;
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('vehicle_people')
      .insert({
        company_id: companyId,
        vehicle_id: vehicleId,
        person_id: personId,
      });
    if (error) {
      if ((error as any).code === '23505') {
        const msg = 'Esta pessoa já está vinculada a este veículo.';
        return NextResponse.json({ ok: false, error: msg }, { status: 409 });
      }
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

export async function DELETE(req: Request) {
  try {
    const body = await parseJsonSafe(req).catch(() => null);
    const parsed = vehiclePeopleSchema.safeParse(body);
    if (!parsed.success) {
      const invalid =
        parsed.error.errors.length === 1 &&
        parsed.error.errors[0].path.length === 0;
      const msg = invalid
        ? 'Requisição inválida (corpo ausente ou inválido).'
        : parsed.error.errors.map((e) => e.message).join(' ');
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    const { vehicleId, personId } = parsed.data;
    const companyId = env.COMPANY_ID;
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('vehicle_people')
      .delete()
      .eq('company_id', companyId)
      .eq('vehicle_id', vehicleId)
      .eq('person_id', personId);
    if (error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado no servidor.' },
      { status: 500 }
    );
  }
}
