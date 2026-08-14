import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatGeneratedAt = () =>
  new Date().toLocaleString('pt-BR');

export function exportPDF({ title, subtitle, sections, filename }) {
  const doc = new jsPDF();
  let y = 18;

  doc.setFontSize(16);
  doc.setTextColor(26, 27, 39);
  doc.text(title, 14, y);

  y += 7;
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitle, 14, y);
    y += 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Gerado em ${formatGeneratedAt()}`, 14, y);
  y += 8;

  sections.forEach((section) => {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 18;
    }

    doc.setFontSize(12);
    doc.setTextColor(26, 27, 39);
    doc.text(section.heading, 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [section.columns],
      body: section.rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [214, 64, 0], textColor: 255 },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function exportExcel({ filename, sheets }) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const aoa = [sheet.columns, ...sheet.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.substring(0, 31));
  });

  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
