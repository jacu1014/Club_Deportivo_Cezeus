import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoCezeus from '../components/Logo_Cezeus.jpeg';

/**
 * Servicio unificado para generar el reporte oficial del Club Deportivo Cezeus.
 * Versión JavaScript Puro (compatible con archivos .js)
 */
export const generarReporteCEZEUS = async (
  titulo = "Reporte de Alumnos",
  datosMapeados = [],
  columnasPersonalizadas = null
) => {
  try {
    // Crear documento en orientación horizontal (landscape)
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

    // 1. Intentar agregar el Logo Institucional
    try {
      doc.addImage(logoCezeus, 'JPEG', 14, 10, 25, 25);
    } catch (e) {
      console.warn("Logo no cargado o ruta incorrecta. Verifica '../components/Logo_Cezeus.jpeg'");
    }

    // 2. Encabezado del Club
    doc.setFontSize(22);
    doc.setTextColor(22, 160, 133); // Verde Esmeralda Cezeus
    doc.setFont('helvetica', 'bold');
    doc.text("Club Deportivo Cezeus", 45, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'italic');
    doc.text(titulo.toUpperCase(), 45, 29);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString()}`, 45, 34);

    // Línea decorativa bajo el encabezado
    doc.setDrawColor(22, 160, 133);
    doc.setLineWidth(0.5);
    doc.line(14, 38, 283, 38);

    // 3. Definición de Columnas (Usa las enviadas o las de por defecto)
    const columnas = columnasPersonalizadas || [
      { header: 'DOCUMENTO', dataKey: 'doc' },
      { header: 'ALUMNO', dataKey: 'nombre_alumno' },
      { header: 'CATEGORÍA', dataKey: 'categoria' },
      { header: 'RH', dataKey: 'rh' },
      { header: 'EPS', dataKey: 'eps' },
      { header: 'ACUDIENTE', dataKey: 'acudiente' },
      { header: 'CONTACTOS', dataKey: 'contactos' },
      { header: 'ESTADO', dataKey: 'estado' }
    ];

    // 4. Generación de la Tabla con jsPDF-AutoTable
    autoTable(doc, {
      startY: 42,
      head: [columnas.map(col => col.header)],
      body: datosMapeados.map(fila => columnas.map(col => fila[col.dataKey] || 'N/A')),
      theme: 'striped',
      headStyles: { 
        fillColor: [22, 160, 133], 
        textColor: 255, 
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 7, 
        cellPadding: 3,
        valign: 'middle'
      },
      columnStyles: {
        1: { cellWidth: 50 }, // Ancho para nombre del Alumno
        5: { cellWidth: 50 }, // Ancho para nombre del Acudiente
        7: { halign: 'center', fontStyle: 'bold' } // Centrar columna Estado
      },
      didParseCell: (data) => {
        // Aplicar colores según el texto del Estado (en la columna de índice 7)
        if (data.section === 'body' && data.column.index === 7) {
          const val = String(data.cell.raw).toUpperCase();
          if (val.includes('ACTIVO')) {
            data.cell.styles.textColor = [39, 174, 96]; // Verde éxito
          } else if (val.includes('INACTIVO')) {
            data.cell.styles.textColor = [192, 57, 43]; // Rojo error
          }
        }
      }
    });

    // 5. Pie de página con numeración
    const totalPages = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.text(
        `Documento oficial de control interno - Club Deportivo Cezeus - Página ${i} de ${totalPages}`,
        283 / 2, 205, { align: 'center' }
      );
    }

    // 6. Ejecutar Descarga del archivo
    const nombreLimpio = titulo.replace(/\s+/g, '_');
    const timestamp = new Date().getTime();
    doc.save(`Reporte_${nombreLimpio}_${timestamp}.pdf`);

  } catch (error) {
    console.error("Error crítico al generar el PDF:", error);
    alert("No se pudo generar el reporte. Asegúrate de haber instalado jspdf y jspdf-autotable.");
  }
};