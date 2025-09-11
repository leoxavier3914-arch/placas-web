import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    const companyId = process.env.COMPANY_ID;
    if (!companyId) {
      console.error('COMPANY_ID not configured');
      return NextResponse.json(
        { ok: false, error: 'COMPANY_ID not configured' },
        { status: 500 }
      );
    }
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
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Requisição inválida (corpo ausente ou inválido).' },
        { status: 400 }
      );
    }
    const { vehicleId, personId } = body;
    if (!vehicleId || !personId) {
      return NextResponse.json(
        { ok: false, error: 'vehicleId e personId são obrigatórios.' },
        { status: 400 }
      );
    }
    const companyId = process.env.COMPANY_ID;
    if (!companyId) {
      console.error('COMPANY_ID not configured');
      return NextResponse.json(
        { ok: false, error: 'COMPANY_ID not configured' },
        { status: 500 }
      );
    }
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
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Requisição inválida (corpo ausente ou inválido).' },
        { status: 400 }
      );
    }
    const { vehicleId, personId } = body;
    if (!vehicleId || !personId) {
      return NextResponse.json(
        { ok: false, error: 'vehicleId e personId são obrigatórios.' },
        { status: 400 }
      );
    }
    const companyId = process.env.COMPANY_ID;
    if (!companyId) {
      console.error('COMPANY_ID not configured');
      return NextResponse.json(
        { ok: false, error: 'COMPANY_ID not configured' },
        { status: 500 }
      );
    }
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
