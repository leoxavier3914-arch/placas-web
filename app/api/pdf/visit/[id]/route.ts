export const runtime = 'nodejs';

import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function ensureExportsBucket() {
  // Tentativa “idempotente”: cria o bucket se não existir (ignora erro se já existir).
  try {
    await supabaseAdmin.storage.createBucket('exports', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    });
  } catch (_e) {
    // ignore: já existe
  }
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    // 0) Garante bucket
    await ensureExportsBucket();

    // 1) Busca a visita e joins
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

    // 2) Gera o PDF em memória
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (c: Uint8Array) => chunks.push(Buffer.from(c)));
    const finished = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(18).text('Registro de Visita', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Filial: ${visit.branches?.name ?? '-'}`);
    doc.text(`Pessoa: ${visit.people?.full_name ?? '-'}`);
    doc.text(`Placa: ${visit.vehicles?.plate ?? '-'}`);
    doc.text(`Entrada: ${new Date(visit.checkin_time).toLocaleString()}`);
    if (visit.checkout_time) doc.text(`Saída: ${new Date(visit.checkout_time).toLocaleString()}`);
    doc.end();

    // 3) Espera PDF terminar
    const pdf = await finished;
    const path = `visits/${params.id}.pdf`;

    // 4) Upload no bucket
    const up = await supabaseAdmin.storage
      .from('exports')
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true });

    if (up.error) {
      return NextResponse.json(
        { ok: false, error: `Falha no upload: ${up.error.message}` },
        { status: 500 }
      );
    }

    // 5) URL assinada
    const signed = await supabaseAdmin.storage.from('exports').createSignedUrl(path, 60 * 10);
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: `Falha ao assinar URL: ${signed.error?.message ?? 'sem URL'}` },
        { status: 500 }
      );
    }

    // 6) Evento de auditoria
    await supabaseAdmin.from('visit_events').insert({
      visit_id: params.id,
      type: 'pdf_exported',
      meta: { url: signed.data.signedUrl },
    });

    // 7) Retorna link
    return NextResponse.json({ ok: true, url: signed.data.signedUrl });
  } catch (e: any) {
    // Pega QUALQUER exceção e devolve JSON (evita HTML/“unexpected end of JSON” no cliente)
    const msg = typeof e?.message === 'string' ? e.message : 'Erro inesperado ao gerar PDF.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
