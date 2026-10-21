/**
 * Utility to download and print resumes formatted as professional A4 PDF documents.
 */

export interface ResumeExportData {
  title: string;
  fullName?: string;
  phone?: string;
  email?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}

export function downloadResumeAsPDF(resume: ResumeExportData) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Iltimos, brauzeringizda pop-up (oyna) ochishga ruxsat bering.');
    return;
  }

  const cleanTitle = resume.title || 'Rezyume';
  const cleanName = resume.fullName || 'Fuqaro';
  const cleanPhone = resume.phone || '';
  const cleanEmail = resume.email || '';
  const cleanLocation = resume.location || '';
  const cleanSummary = (resume.summary || '').trim();

  // Escape HTML characters
  const escapeHTML = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formattedContent = escapeHTML(cleanSummary)
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<br/>';
      if (trimmed.startsWith('#') || trimmed.toUpperCase() === trimmed && trimmed.length > 3 && !trimmed.includes('.')) {
        return `<h3 style="font-size: 15px; font-weight: 800; color: #1e3a8a; margin: 18px 0 6px 0; border-bottom: 1.5px solid #dbeafe; padding-bottom: 4px;">${trimmed.replace(/^#+\s*/, '')}</h3>`;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        return `<li style="margin-left: 20px; color: #334155; font-size: 13.5px; line-height: 1.6;">${trimmed.substring(1).trim()}</li>`;
      }
      return `<p style="margin: 4px 0; color: #334155; font-size: 13.5px; line-height: 1.6;">${trimmed}</p>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(cleanName)} - ${escapeHTML(cleanTitle)} (WorkHub)</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2.5px solid #2563eb;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .name {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .profession {
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
      margin: 0 0 10px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .contacts-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12.5px;
      color: #475569;
      margin-top: 8px;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-weight: 600;
    }
    .resume-body {
      font-size: 13.5px;
      line-height: 1.6;
      color: #1e293b;
    }
    .footer {
      margin-top: 36px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div>
        <h1 class="name">${escapeHTML(cleanName)}</h1>
        <div class="profession">${escapeHTML(cleanTitle)}</div>
      </div>
      <div class="badge">WorkHub Tasdiqlangan Rezyume</div>
    </div>
    <div class="contacts-row">
      ${cleanPhone ? `<span class="contact-item">📞 ${escapeHTML(cleanPhone)}</span>` : ''}
      ${cleanEmail ? `<span class="contact-item">✉️ ${escapeHTML(cleanEmail)}</span>` : ''}
      ${cleanLocation ? `<span class="contact-item">📍 ${escapeHTML(cleanLocation)}</span>` : ''}
    </div>
  </div>

  <div class="resume-body">
    ${formattedContent}
  </div>

  <div class="footer">
    <span>Rasmiy WorkHub platformasi (workhub.uz) orqali shakllantirildi</span>
    <span>Sana: ${new Date().toLocaleDateString('uz-UZ')}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
