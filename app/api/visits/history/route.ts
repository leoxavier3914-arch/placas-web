import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/** Converte '2025-09-06' -> '2025-09-06T00:00:00.000Z' e fim do dia */
function toIsoStart(d: string) { return new Date(d + 'T00:00:00.000Z').toISOString(); }
function toIsoEnd(d: string)   { return new Date(d + 'T23:59:59.999Z').toISOString(); }

/**
 * GET /api/visits/history?start=YYYY-MM-DD&end=YYYY-MM-DD&page=1&pageSize=10
 * - Filtra registros da filial atual em que (checkin_time ∈ intervalo) OU (checkout_time ∈ intervalo).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get('start'); // yyyy-mm-dd
    const end   = url.searchParams.get('end');   // yyyy-mm-dd
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(url.searchParams.get('pageSize') || '10', 10)));

    if (!start || !end) {
      return NextResponse.json(
        { ok: false, error: 'Parâmetros obrigatórios: start e end (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    const startIso = toIsoStart(start);
    const endIso   = toIsoEnd(end);
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    // Filtro OR (checkin dentro do intervalo) OU (checkout dentro do intervalo)
    // Supabase usa sintaxe: .or('and(a.gte.x,a.lte.y),and(b.gte.x,b.lte.y))'
    const orExpr =
      `and(checkin_time.gte.${startIso},checkin_time.lte.${endIso}),` +
      `and(checkout_time.gte.${startIso},checkout_time.lte.${endIso})`;

    const { data, error, count } = await supabaseAdmin
      .from('visits')
      .select(
        'id, checkin_time, checkout_time, purpose, ' +
        'people(full_name, doc_number), ' +
        'vehicles(plate, model, color), ' +
        'branches(name)',
        { count: 'exact' }
      )
      .eq('company_id', process.env.COMPANY_ID!)
      .eq('branch_id', process.env.DEFAULT_BRANCH_ID!)
      .or(orExpr)
      .order('checkin_time', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado.' },
      { status: 500 }
    );
  }
}
