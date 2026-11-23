// Builds a tiny, valid, one-page PDF in memory (Task 3 demo only).
// Everything is plain ASCII, so string length equals byte length and the
// cross-reference offsets below are exact.
export function buildSamplePdfBlob(): Blob {
  const content = 'BT /F1 24 Tf 72 760 Td (LORIS sample PDF) Tj ET';

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R ' +
      '/Resources << /Font << /F1 5 0 R >> >> >>',
    << /Length ${content.length} >>\nstream\n${content}\nendstream,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += ${i + 1} 0 obj\n${body}\nendobj\n;
  });

  const xrefStart = pdf.length;
  pdf += xref\n0 ${objects.length + 1}\n0000000000 65535 f \n;
  pdf += offsets.map((o) => ${String(o).padStart(10, '0')} 00000 n \n).join('');
  pdf += trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF;

  return new Blob([pdf], { type: 'application/pdf' });
}    this is the code
