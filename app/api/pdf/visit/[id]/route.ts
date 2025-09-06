export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function ensureExportsBucket() {
  try {
    await supabaseAdmin.storage.createBucket('exports', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024
    });
  } catch {
    // já existe -> ignora
  }
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    await ensureExportsBucket();

    // 1) Buscar a visita + joins
    const { data: visit, error } = await supabaseAdmin
      .from('visits')
      .select('*, people(*), vehicles(*), branches(name)')
      .eq('id', params.id)
      .single();

    if (error || !visit) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? 'Visita não encontrada.' },
        { status: 404 }
      );
    }

    // 2) Criar PDF com pdf-lib (sem arquivos de fonte)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 retrato
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;
    const left = 50;

    const write = (text: string, size = 12) => {
      page.drawText(text, { x: left, y, size, font, color: rgb(0, 0, 0) });
      y -= size + 8;
    };

    write('Registro de Visita', 20);
    y -= 6;

    write(`Filial: ${visit.branches?.name ?? '-'}`);
    write(`Pessoa: ${visit.people?.full_name ?? '-'}`);
    write(`Placa: ${visit.vehicles?.plate ?? '-'}`);
    write(`Entrada: ${new Date(visit.checkin_time).toLocaleString()}`);
    if (visit.checkout_time) {
      write(`Saída: ${new Date(visit.checkout_time).toLocaleString()}`);
    }

    const pdfBytes = await pdfDoc.save(); // Uint8Array
    const pdfBuffer = Buffer.from(pdfBytes);

    // 3) Upload no Storage
    const path = `visits/${params.id}.pdf`;
    const up = await supabaseAdmin.storage
      .from('exports')
      .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (up.error) {
      return NextResponse.json(
        { ok: false, error: `Falha no upload: ${up.error.message}` },
        { status: 500 }
      );
    }

    // 4) URL assinada
    const signed = await supabaseAdmin.storage.from('exports').createSignedUrl(path, 60 * 10);
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: `Falha ao assinar URL: ${signed.error?.message ?? 'sem URL'}` },
        { status: 500 }
      );
    }

    // 5) Evento de auditoria
    await supabaseAdmin.from('visit_events').insert({
      visit_id: params.id,
      type: 'pdf_exported',
      meta: { url: signed.data.signedUrl }
    });

    // 6) Resposta
    return NextResponse.json({ ok: true, url: signed.data.signedUrl });
  } catch (e: any) {
    const msg = e?.message ?? 'Erro inesperado ao gerar PDF.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
