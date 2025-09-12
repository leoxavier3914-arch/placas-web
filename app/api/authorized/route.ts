import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';
import env from '@/lib/env';
import { ensurePerson, ensureVehicle } from '@/lib/ensure';
import { getValidationErrorMsg } from '@/lib/validation';
import { z } from 'zod';
import { parseJsonSafe } from '@/lib/api';

const authorizedSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, 'Placa é obrigatória.')
    .refine((val) => !!normalizePlate(val), 'Placa inválida.')
    .transform((val) => normalizePlate(val)!),
  name: z.string().trim().min(1, 'Nome é obrigatório.'),
  department: z.string().trim().min(1, 'Departamento é obrigatório.'),
  model: z.string().trim().nullish(),
  color: z.string().trim().nullish(),
});

export async function GET() {
  try {
    const companyId = env.COMPANY_ID;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('authorized')
      .select('id, plate, name, department')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    const plates = data.map((a: any) => a.plate);
    let vehiclesMap = new Map<string, any>();
    if (plates.length > 0) {
      const { data: vehicles, error: vehErr } = await supabaseAdmin
        .from('vehicles')
        .select('plate, model, color')
        .eq('company_id', companyId)
        .in('plate', plates);
      if (vehErr) {
        return NextResponse.json(
          { ok: false, error: vehErr.message },
          { status: 400 }
        );
      }
      vehiclesMap = new Map(vehicles.map((v: any) => [v.plate, v]));
    }

    const result = data.map((a: any) => ({
      ...a,
      model: vehiclesMap.get(a.plate)?.model ?? null,
      color: vehiclesMap.get(a.plate)?.color ?? null,
    }));

    return NextResponse.json({ ok: true, data: result });
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
    const parsed = authorizedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: getValidationErrorMsg(parsed) },
        { status: 400 }
      );
    }

    const { plate, name, department, model, color } = parsed.data;

    const companyId = env.COMPANY_ID;
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
        model ?? null,
        color ?? null
      );
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }

    const insert = {
      company_id: companyId,
      plate,
      name,
      department,
    };

    const { data, error } = await supabaseAdmin
      .from('authorized')
      .insert(insert)
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
