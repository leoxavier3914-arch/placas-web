import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';
import { getCompanyId } from '@/lib/env';

export async function GET() {
  try {
    const companyId = getCompanyId();
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

    // ensure person exists
    let personId: string;
    const { data: existingPerson, error: personSelErr } = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('company_id', companyId)
      .eq('full_name', name)
      .maybeSingle();
    if (personSelErr) {
      return NextResponse.json({ ok: false, error: personSelErr.message }, { status: 400 });
    }
    if (existingPerson) {
      personId = existingPerson.id;
    } else {
      const { data: newPerson, error: personInsErr } = await supabaseAdmin
        .from('people')
        .insert({ company_id: companyId, full_name: name })
        .select()
        .single();
      if (personInsErr) {
        return NextResponse.json({ ok: false, error: personInsErr.message }, { status: 400 });
      }
      personId = newPerson.id;
    }

    // ensure vehicle exists
    let vehicleId: string;
    const { data: existingVehicle, error: vehicleSelErr } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('company_id', companyId)
      .eq('plate', plate)
      .maybeSingle();
    if (vehicleSelErr) {
      return NextResponse.json({ ok: false, error: vehicleSelErr.message }, { status: 400 });
    }
    if (existingVehicle) {
      vehicleId = existingVehicle.id;
      if (model || color) {
        const { error: vehicleUpdErr } = await supabaseAdmin
          .from('vehicles')
          .update({ model, color })
          .eq('id', vehicleId);
        if (vehicleUpdErr) {
          return NextResponse.json(
            { ok: false, error: vehicleUpdErr.message },
            { status: 400 }
          );
        }
      }
    } else {
      const { data: newVehicle, error: vehicleInsErr } = await supabaseAdmin
        .from('vehicles')
        .insert({ company_id: companyId, plate, model, color })
        .select()
        .single();
      if (vehicleInsErr) {
        return NextResponse.json({ ok: false, error: vehicleInsErr.message }, { status: 400 });
      }
      vehicleId = newVehicle.id;
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
