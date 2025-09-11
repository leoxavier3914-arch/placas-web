export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { SupabaseClient } from '@supabase/supabase-js';

function toIsoStart(d: string) { return new Date(d + 'T00:00:00.000Z').toISOString(); }
function toIsoEnd(d: string)   { return new Date(d + 'T23:59:59.999Z').toISOString(); }

async function ensureExportsBucket(client: SupabaseClient) {
  try {
    await client.storage.createBucket('exports', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
    });
  } catch { /* já existe */ }
}

// 🔒 Tipos mínimos para garantir build
type VisitRow = {
  id: string;
  checkin_time: string;
  checkout_time: string | null;
  purpose?: string | null;
  people?: { full_name?: string | null; doc_number?: string | null } | null;
  vehicles?: { plate?: string | null; model?: string | null; color?: string | null } | null;
  branches?: { name?: string | null } | null;
};

/**
 * POST /api/pdf/history?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Gera PDF com TODO o histórico do período (check-in OU check-out no intervalo) da filial atual.
 */
export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await ensureExportsBucket(supabaseAdmin);

    const url = new URL(req.url);
    const start = url.searchParams.get('start');
    const end   = url.searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { ok: false, error: 'Parâmetros obrigatórios: start e end (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    const startIso = toIsoStart(start);
    const endIso   = toIsoEnd(end);

    const orExpr =
      `and(checkin_time.gte.${startIso},checkin_time.lte.${endIso}),` +
      `and(checkout_time.gte.${startIso},checkout_time.lte.${endIso})`;

    const { data, error } = await supabaseAdmin
      .from('visits')
      .select(
        'id, checkin_time, checkout_time, purpose, ' +
        'people(full_name, doc_number), ' +
        'vehicles(plate, model, color), ' +
        'branches(name)'
      )
      .eq('company_id', process.env.COMPANY_ID!)
      .eq('branch_id', process.env.DEFAULT_BRANCH_ID!)
      .or(orExpr)
      .order('checkin_time', { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    // 🔧 Tipagem explícita do array
    const list: VisitRow[] = Array.isArray(data) ? (data as unknown as VisitRow[]) : [];

    // Montar PDF (tabela simples, com quebra de página)
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595, pageHeight = 842;
    const margin = 36;
    const lineHeight = 14;
    const headerSize = 14;
    const textSize = 10;
    const rowGap = 6;

    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawText = (t: string, x: number, size = textSize) => {
      page.drawText(t, { x, y, size, font, color: rgb(0, 0, 0) });
    };
    const newPage = () => {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    };

    // Cabeçalho
    drawText('Relatório de Entradas e Saídas — Filial Atual', margin, headerSize);
    y -= headerSize + 6;
    drawText(`Período: ${start} a ${end}`, margin);
    y -= lineHeight + 8;

    // Colunas
    const colX = {
      entrada: margin,
      saida: margin + 140,
      placa: margin + 280,
      pessoa: margin + 360,
    };
    drawText('Entrada', colX.entrada, 11);
    drawText('Saída',   colX.saida,   11);
    drawText('Placa',   colX.placa,   11);
    drawText('Pessoa',  colX.pessoa,  11);
    y -= lineHeight + 2;

    // Linha separadora
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, color: rgb(0, 0, 0) });
    y -= lineHeight;

    if (list.length === 0) {
      drawText('Nenhum registro no período.', margin);
    } else {
      for (const v of list) {
        const entrada = new Date(v.checkin_time).toLocaleString();
        const saida   = v.checkout_time ? new Date(v.checkout_time).toLocaleString() : '-';
        const placa   = v.vehicles?.plate ?? '-';
        const pessoa  = v.people?.full_name ?? '-';
        const nome    = pessoa.length > 28 ? pessoa.slice(0, 27) + '…' : pessoa;

        // quebra de página
        if (y < margin + 40) newPage();

        drawText(entrada, colX.entrada);
        drawText(saida,   colX.saida);
        drawText(placa,   colX.placa);
        drawText(nome,    colX.pessoa);

        y -= lineHeight + rowGap;
      }
    }

    const pdfBytes = await pdf.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const fileName = `history_${start}_${end}.pdf`;
    const path = `reports/${fileName}`;

    const up = await supabaseAdmin.storage
      .from('exports')
      .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (up.error) {
      return NextResponse.json(
        { ok: false, error: `Falha no upload: ${up.error.message}` },
        { status: 500 }
      );
    }

    const signed = await supabaseAdmin.storage.from('exports').createSignedUrl(path, 60 * 10);
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: `Falha ao assinar URL: ${signed.error?.message ?? 'sem URL'}` },
        { status: 500 }
      );
    }

    await supabaseAdmin.from('visit_events').insert({
      visit_id: null,
      type: 'history_pdf_exported',
      meta: { start, end, url: signed.data.signedUrl },
    });

    return NextResponse.json({ ok: true, url: signed.data.signedUrl });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado ao gerar PDF.' },
      { status: 500 }
    );
  }
}
