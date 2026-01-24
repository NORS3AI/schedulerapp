import jsPDF from 'jspdf';
import type { Session, Room, TimeSlot } from '../store/types';
import type { ExportField } from '../components/Export/CustomExportModal';

interface PdfOptions {
  title: string;
  days: string[];
  timeSlots: TimeSlot[];
  rooms: Room[];
  sessions: Session[];
}

interface CustomPdfOptions {
  title: string;
  sessions: Session[];
  rooms: Room[];
  fields: ExportField[];
}

// Format time to 12-hour format
function formatTime12h(time: string): string {
  const [hours, mins] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
}

export async function exportScheduleToPdf(options: PdfOptions): Promise<void> {
  const { title, days, timeSlots, rooms, sessions } = options;
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  let isFirstPage = true;

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];

    // V1.1.3: Check if any sessions are scheduled for this day - skip empty days
    const sessionsForDay = sessions.filter((s) => s.day === day);
    if (sessionsForDay.length === 0) {
      continue; // Skip this entire day
    }

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${title} - ${day}`, margin, margin + 5);

    // Table setup
    const tableTop = margin + 15;
    const timeColWidth = 35;
    const roomColWidth = (pageWidth - margin * 2 - timeColWidth) / Math.max(rooms.length, 1);
    const rowHeight = 20;

    // Header row
    pdf.setFontSize(10);
    pdf.setFillColor(59, 130, 246); // primary blue
    pdf.setTextColor(255, 255, 255);

    // Time column header
    pdf.rect(margin, tableTop, timeColWidth, 10, 'F');
    pdf.text('Time', margin + 2, tableTop + 7);

    // Room headers
    for (let i = 0; i < rooms.length; i++) {
      const x = margin + timeColWidth + i * roomColWidth;
      pdf.rect(x, tableTop, roomColWidth, 10, 'F');
      pdf.text(rooms[i].name, x + 2, tableTop + 7, {
        maxWidth: roomColWidth - 4,
      });
    }

    // Reset text color
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    // Time slot rows
    let currentY = tableTop + 10;

    for (const slot of timeSlots) {
      // Check if any session exists in this slot for this day
      const hasSessionInSlot = sessions.some(
        (s) => s.day === day && s.timeSlot === slot.startTime
      );

      // V1.1.3: Skip ALL empty rows including breaks/lunch if no sessions in that slot
      if (!hasSessionInSlot) {
        continue;
      }

      const slotLabel = `${formatTime12h(slot.startTime)} - ${formatTime12h(slot.endTime)}`;

      // Time cell - use different color for breaks (though breaks with sessions are rare)
      if (slot.isBreak) {
        pdf.setFillColor(254, 243, 199); // amber-100
        pdf.rect(margin, currentY, timeColWidth, rowHeight, 'FD');
        pdf.setFontSize(9);
        pdf.text(slot.breakLabel || 'Break', margin + 2, currentY + 8);

        // Fill all room cells with break indication
        for (let i = 0; i < rooms.length; i++) {
          const x = margin + timeColWidth + i * roomColWidth;
          pdf.setFillColor(254, 243, 199); // amber-100
          pdf.rect(x, currentY, roomColWidth, rowHeight, 'FD');
        }
      } else {
        // Time cell
        pdf.setFillColor(243, 244, 246); // gray-100
        pdf.rect(margin, currentY, timeColWidth, rowHeight, 'FD');
        pdf.setFontSize(9);
        pdf.text(slotLabel, margin + 2, currentY + 8);

        // Room cells
        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];
          const x = margin + timeColWidth + i * roomColWidth;

          // Find session in this slot
          const session = sessions.find(
            (s) =>
              s.day === day &&
              s.timeSlot === slot.startTime &&
              s.roomId === room.id
          );

          if (session) {
            pdf.setFillColor(220, 252, 231); // green-100
            pdf.rect(x, currentY, roomColWidth, rowHeight, 'FD');
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(session.sessionTitle, x + 2, currentY + 6, {
              maxWidth: roomColWidth - 4,
            });
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.text(session.presenterName, x + 2, currentY + 12, {
              maxWidth: roomColWidth - 4,
            });
          } else {
            pdf.setFillColor(255, 255, 255);
            pdf.rect(x, currentY, roomColWidth, rowHeight, 'D');
          }
        }
      }

      currentY += rowHeight;

      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
    }
  }

  // Footer on last page
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text(
    `Generated on ${new Date().toLocaleDateString()} by Conference Scheduler 2026`,
    margin,
    pageHeight - 10
  );

  // Download
  const date = new Date().toISOString().split('T')[0];
  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}_schedule_${date}.pdf`);
}

export async function exportToPdfWithHtml2Canvas(
  elementId: string,
  filename: string
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight - 20) {
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  } else {
    // Scale to fit
    const scaledHeight = pageHeight - 20;
    const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
    pdf.addImage(imgData, 'PNG', 10, 10, scaledWidth, scaledHeight);
  }

  pdf.save(filename);
}

// Get field value from session
function getFieldValue(session: Session, field: ExportField, rooms: Room[]): string {
  switch (field.key) {
    case 'day':
      return session.day || '';
    case 'timeSlot':
      if (session.timeSlot) {
        const [hours, mins] = session.timeSlot.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
      }
      return '';
    case 'room':
      if (session.roomId) {
        const room = rooms.find(r => r.id === session.roomId);
        return room?.name || '';
      }
      return '';
    case 'sessionTitle':
      return session.sessionTitle || '';
    case 'description':
      return session.description || '';
    case 'presenterName':
      return session.presenterName || '';
    case 'presenterFirstName':
      return session.presenterFirstName || '';
    case 'presenterLastName':
      return session.presenterLastName || '';
    case 'presenterEmail':
      return session.presenterEmail || '';
    case 'presenterPhone':
      return session.presenterPhone || '';
    case 'presenterCompany':
      return session.presenterCompany || '';
    case 'presenterTitle':
      return session.presenterTitle || '';
    case 'coPresenterName':
      return session.coPresenterName || '';
    case 'coPresenterEmail':
      return session.coPresenterEmail || '';
    case 'coPresenterPhone':
      return session.coPresenterPhone || '';
    case 'duration':
      return session.duration ? String(session.duration) : '';
    case 'expectedAttendees':
      return session.expectedAttendees ? String(session.expectedAttendees) : '';
    case 'masteryLevel':
      if (Array.isArray(session.masteryLevel)) {
        return session.masteryLevel.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
      }
      return session.masteryLevel ? session.masteryLevel.charAt(0).toUpperCase() + session.masteryLevel.slice(1) : '';
    case 'breakoutNumber':
      return session.breakoutNumber ? String(session.breakoutNumber) : '';
    case 'capacityLevel':
      return session.capacityLevel || '';
    default:
      return '';
  }
}

// Export sessions as a table-format PDF with custom fields
export async function exportCustomPdf(options: CustomPdfOptions): Promise<void> {
  const { title, sessions, rooms, fields } = options;
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, margin + 5);

  // Calculate column widths based on number of fields
  const tableWidth = pageWidth - margin * 2;
  const colWidth = tableWidth / fields.length;

  // Header row
  const headerY = margin + 12;
  const rowHeight = 8;
  pdf.setFontSize(8);
  pdf.setFillColor(59, 130, 246); // primary blue
  pdf.setTextColor(255, 255, 255);

  for (let i = 0; i < fields.length; i++) {
    const x = margin + i * colWidth;
    pdf.rect(x, headerY, colWidth, rowHeight, 'F');
    pdf.text(fields[i].label, x + 2, headerY + 5.5, {
      maxWidth: colWidth - 4,
    });
  }

  // Reset colors
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');

  // Data rows
  let currentY = headerY + rowHeight;
  const dataRowHeight = 10;

  // Sort sessions by day, time, room for organized output
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.day !== b.day) return (a.day || '').localeCompare(b.day || '');
    if (a.timeSlot !== b.timeSlot) return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    const roomA = rooms.find(r => r.id === a.roomId)?.name || '';
    const roomB = rooms.find(r => r.id === b.roomId)?.name || '';
    return roomA.localeCompare(roomB);
  });

  for (let rowIdx = 0; rowIdx < sortedSessions.length; rowIdx++) {
    const session = sortedSessions[rowIdx];

    // Check for page break
    if (currentY + dataRowHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;

      // Re-draw header on new page
      pdf.setFontSize(8);
      pdf.setFillColor(59, 130, 246);
      pdf.setTextColor(255, 255, 255);
      for (let i = 0; i < fields.length; i++) {
        const x = margin + i * colWidth;
        pdf.rect(x, currentY, colWidth, rowHeight, 'F');
        pdf.text(fields[i].label, x + 2, currentY + 5.5, {
          maxWidth: colWidth - 4,
        });
      }
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      currentY += rowHeight;
    }

    // Alternate row background
    if (rowIdx % 2 === 0) {
      pdf.setFillColor(249, 250, 251); // gray-50
      pdf.rect(margin, currentY, tableWidth, dataRowHeight, 'F');
    }

    // Draw cell borders and content
    for (let i = 0; i < fields.length; i++) {
      const x = margin + i * colWidth;
      const value = getFieldValue(session, fields[i], rooms);

      pdf.setDrawColor(229, 231, 235); // gray-200
      pdf.rect(x, currentY, colWidth, dataRowHeight, 'D');

      pdf.setFontSize(7);
      // Truncate long text
      const maxChars = Math.floor(colWidth / 1.8);
      const displayValue = value.length > maxChars ? value.substring(0, maxChars - 2) + '...' : value;
      pdf.text(displayValue, x + 2, currentY + 6, {
        maxWidth: colWidth - 4,
      });
    }

    currentY += dataRowHeight;
  }

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(128, 128, 128);
  pdf.text(
    `Generated on ${new Date().toLocaleDateString()} by Conference Scheduler 2026 | ${sessions.length} sessions`,
    margin,
    pageHeight - 5
  );

  // Download
  const date = new Date().toISOString().split('T')[0];
  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}_custom_${date}.pdf`);
}

// Generate HTML table for printing with custom fields
export function generatePrintHtml(
  title: string,
  sessions: Session[],
  rooms: Room[],
  fields: ExportField[]
): string {
  // Sort sessions by day, time, room
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.day !== b.day) return (a.day || '').localeCompare(b.day || '');
    if (a.timeSlot !== b.timeSlot) return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    const roomA = rooms.find(r => r.id === a.roomId)?.name || '';
    const roomB = rooms.find(r => r.id === b.roomId)?.name || '';
    return roomA.localeCompare(roomB);
  });

  const headerRow = fields.map(f => `<th style="padding: 8px; background: #3b82f6; color: white; text-align: left; font-size: 11px; border: 1px solid #ddd;">${f.label}</th>`).join('');

  const dataRows = sortedSessions.map((session, idx) => {
    const bgColor = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
    const cells = fields.map(f => {
      const value = getFieldValue(session, f, rooms);
      return `<td style="padding: 6px 8px; font-size: 10px; border: 1px solid #ddd; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${value}</td>`;
    }).join('');
    return `<tr style="background: ${bgColor};">${cells}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @media print {
          @page { size: landscape; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 16px; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; }
        .footer { margin-top: 20px; font-size: 9px; color: #6b7280; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString()} by Conference Scheduler 2026 | ${sessions.length} sessions</div>
    </body>
    </html>
  `;
}

// Print custom fields table
export function printCustomTable(
  title: string,
  sessions: Session[],
  rooms: Room[],
  fields: ExportField[]
): void {
  const html = generatePrintHtml(title, sessions, rooms, fields);

  // Open a new window with the print content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
