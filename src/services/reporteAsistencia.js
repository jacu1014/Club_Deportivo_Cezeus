import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// Importante: Asegúrate que la ruta sea correcta. Si da error, usa una URL o base64.
import logoCezeus from '../components/Logo_Cezeus.jpeg';

export const generarReporteAsistencia = async (titulo, datos, fechas) => {
  try {
    // Orientación Horizontal (Landscape) para que quepan más fechas
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

    // 1. Logo y Encabezado con manejo de errores
    try {
      // Si logoCezeus es un import de Vite/Webpack, a veces requiere cargarlo como imagen primero
    if (logoCezeus) {
        doc.addImage(logoCezeus, 'JPEG', 14, 10, 22, 22);
    }
    } catch (e) {
    console.error("Error cargando el logo:", e);
    // El PDF continuará generándose incluso si el logo falla
    }

    // Estilo de Título Principal
    doc.setFontSize(18);
    doc.setTextColor(22, 160, 133); // Verde Esmeralda Cezeus
    doc.setFont("helvetica", "bold");
    doc.text("CLUB DEPORTIVO CEZEUS", 40, 20);
    
    // Subtítulo y Metadatos
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80); // Gris oscuro
    doc.setFont("helvetica", "normal");
    doc.text(`REPORTE: ${titulo.toUpperCase()}`, 40, 26);
    doc.text(`FECHA DE GENERACIÓN: ${new Date().toLocaleString('es-CO')}`, 40, 31);

    // 2. Preparar Columnas: Nombre + cada fecha formateada
    // Añadimos 'TOTAL' al final para dar más valor al reporte
    const encabezados = ['NOMBRE DEL ALUMNO', ...fechas.map(f => formatFechaCorta(f)), 'TOTAL'];
    
    // 3. Preparar Cuerpo
    const cuerpo = datos.map(alumno => {
      let presentes = 0;
      const fila = [alumno.nombreCompleto.toUpperCase()];
      
      fechas.forEach(fecha => {
        const estado = alumno.asistencias[fecha];
        if (estado === 'PRESENTE') {
          presentes++;
          fila.push('P'); // Usamos 'P' en lugar de chulo para mejor compatibilidad de fuentes
        } else if (estado === 'AUSENTE') {
          fila.push('F'); // 'F' de Falta
        } else {
          fila.push('-'); // Sin registro
        }
      });

      fila.push(`${presentes}/${fechas.length}`); // Columna de resumen
      return fila;
    });

    // 4. Generar Tabla con AutoTable
    autoTable(doc, {
      startY: 38,
      head: [encabezados],
      body: cuerpo,
      theme: 'grid',
      styles: { 
        fontSize: 7, 
        halign: 'center', 
        valign: 'middle',
        cellPadding: 2
      },
      headStyles: { 
        fillColor: [22, 160, 133], 
        textColor: 255, 
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [255, 255, 255]
      },
      columnStyles: { 
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 }, // Nombre más ancho
        [encabezados.length - 1]: { fontStyle: 'bold', fillColor: [240, 240, 240] } // Total destacado
      },
      didParseCell: (data) => {
        // Colorear según el contenido
        if (data.section === 'body' && data.column.index !== 0) {
          if (data.cell.raw === 'P') {
            data.cell.styles.textColor = [39, 174, 96]; // Verde
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.cell.raw === 'F') {
            data.cell.styles.textColor = [192, 57, 43]; // Rojo
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Pie de página (Opcional)
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Sistema de Gestión Cezeus`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`Asistencia_Cezeus_${titulo.replace(/\s+/g, '_')}.pdf`);

  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("No se pudo generar el PDF. Revisa la consola.");
  }
};

const formatFechaCorta = (fechaStr) => {
  if (!fechaStr) return '??';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}`;
};