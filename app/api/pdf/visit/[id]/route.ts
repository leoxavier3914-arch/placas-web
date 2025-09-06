export const runtime = 'nodejs';

import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import fs from 'fs';
import path from 'path';

async function ensureExportsBucket() {
  try {
    await supabaseAdmin.storage.createBucket('exports', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
    });
  } catch {}
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    await ensureExportsBucket();

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

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (c: Uint8Array) => chunks.push(Buffer.from(c)));
    const finished = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // 🔑 carregar fonte .ttf embedada
    const fontPath = path.join(process.cwd(), 'app', 'fonts', 'Roboto-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      doc.font('Times-Roman'); // fallback seguro
    }

    doc.fontSize(18).text('Registro de Visita', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Filial: ${visit.branches?.name ?? '-'}`);
    doc.text(`Pessoa: ${visit.people?.full_name ?? '-'}`);
    doc.text(`Placa: ${visit.vehicles?.plate ?? '-'}`);
    doc.text(`Entrada: ${new Date(visit.checkin_time).toLocaleString()}`);
    if (visit.checkout_time) doc.text(`Saída: ${new Date(visit.checkout_time).toLocaleString()}`);
    doc.end();

    const pdf = await finished;
    const pathFile = `visits/${params.id}.pdf`;

    const up = await supabaseAdmin.storage
      .from('exports')
      .upload(pathFile, pdf, { contentType: 'application/pdf', upsert: true });

    if (up.error) {
      return NextResponse.json({ ok: false, error: up.error.message }, { status: 500 });
    }

    const signed = await supabaseAdmin.storage.from('exports').createSignedUrl(pathFile, 600);
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: signed.error?.message ?? 'Falha ao assinar URL.' },
        { status: 500 }
      );
    }

    await supabaseAdmin.from('visit_events').insert({
      visit_id: params.id,
      type: 'pdf_exported',
      meta: { url: signed.data.signedUrl },
    });

    return NextResponse.json({ ok: true, url: signed.data.signedUrl });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Erro inesperado ao gerar PDF.' },
      { status: 500 }
    );
  }
}
