import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { data: visit, error } = await supabaseAdmin
    .from('visits')
    .select('*, people(*), vehicles(*), branches(name)')
    .eq('id', params.id)
    .single();

  if (error || !visit) {
    return NextResponse.json({ ok:false, error: error?.message ?? 'Visit not found' }, { status: 404 });
  }

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', async () => {
    const pdf = Buffer.concat(chunks);
    const path = `visits/${params.id}.pdf`;

    const up = await supabaseAdmin.storage
      .from('exports')
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
    if (up.error) return;

    const signed = await supabaseAdmin.storage.from('exports').createSignedUrl(path, 60 * 10);

    await supabaseAdmin.from('visit_events').insert({
      visit_id: params.id,
      type: 'pdf_exported',
      meta: { url: signed.data?.signedUrl }
    });
  });

  doc.fontSize(18).text('Registro de Visita', { align: 'center' }).moveDown();
  doc.fontSize(12).text(`Filial: ${visit.branches?.name ?? '-'}`);
  doc.text(`Pessoa: ${visit.people?.full_name ?? '-'}`);
  doc.text(`Placa: ${visit.vehicles?.plate ?? '-'}`);
  doc.text(`Entrada: ${new Date(visit.checkin_time).toLocaleString()}`);
  if (visit.checkout_time) doc.text(`Saída: ${new Date(visit.checkout_time).toLocaleString()}`);
  doc.end();

  return NextResponse.json({ ok: true });
}
