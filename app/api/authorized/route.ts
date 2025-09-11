import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePlate } from '@/lib/utils';

export async function GET() {
  try {
    const companyId = process.env.COMPANY_ID;
    if (!companyId) {
      console.error('COMPANY_ID not configured');
      return NextResponse.json(
        { ok: false, error: 'COMPANY_ID not configured' },
        { status: 500 }
      );
    }
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('authorized')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data });
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

    if (!plate || !name || !department) {
      return NextResponse.json(
        { ok: false, error: 'Placa, nome e departamento são obrigatórios.' },
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

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado no servidor.' },
      { status: 500 }
    );
  }
}
