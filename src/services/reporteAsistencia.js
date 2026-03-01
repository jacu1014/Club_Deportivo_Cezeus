import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCezeus from '../components/Logo_Cezeus.jpeg';

export const generarReporteAsistencia = async (titulo, datos, fechas) => {
  try {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

    // 1. Logo y Encabezado
    try { doc.addImage(logoCezeus, 'JPEG', 14, 10, 25, 25); } catch (e) {}

    doc.setFontSize(20);
    doc.setTextColor(22, 160, 133); // Verde Cezeus
    doc.text("Club Deportivo Cezeus", 45, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`REPORTE DE ASISTENCIA: ${titulo}`, 45, 28);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 45, 33);

    // 2. Preparar Columnas: Nombre + cada fecha
    const encabezados = ['ALUMNO', ...fechas.map(f => formatFechaCorta(f))];
    
    // 3. Preparar Cuerpo
    const cuerpo = datos.map(alumno => {
      const fila = [alumno.nombreCompleto];
      fechas.forEach(fecha => {
        const estado = alumno.asistencias[fecha];
        // Usamos checkmark o X
        fila.push(estado === 'PRESENTE' ? '✓' : (estado === 'AUSENTE' ? 'X' : '-'));
      });
      return fila;
    });

    autoTable(doc, {
      startY: 40,
      head: [encabezados],
      body: cuerpo,
      theme: 'grid',
      styles: { fontSize: 7, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 45 } },
      didParseCell: (data) => {
        // Colorear el chulo de verde y la X de rojo
        if (data.section === 'body' && data.column.index !== 0) {
          if (data.cell.raw === '✓') data.cell.styles.textColor = [39, 174, 96];
          if (data.cell.raw === 'X') data.cell.styles.textColor = [192, 57, 43];
        }
      }
    });

    doc.save(`Asistencia_${titulo.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Error PDF:", error);
  }
};

// Función auxiliar para fecha 2026-02-21 -> 21/02
const formatFechaCorta = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}`;
};