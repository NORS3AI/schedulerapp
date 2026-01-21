import jsPDF from 'jspdf';
import type { Session, Room, TimeSlot } from '../store/types';

interface PdfOptions {
  title: string;
  days: string[];
  timeSlots: TimeSlot[];
  rooms: Room[];
  sessions: Session[];
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

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];

    if (dayIndex > 0) {
      pdf.addPage();
    }

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

      // Skip empty non-break rows
      if (!hasSessionInSlot && !slot.isBreak) {
        continue;
      }

      const slotLabel = `${formatTime12h(slot.startTime)} - ${formatTime12h(slot.endTime)}`;

      // Time cell - use different color for breaks
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
