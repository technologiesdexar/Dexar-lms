/**
 * Google Drive & Document Utility for Dexar LMS
 * Handles parsing, preview generation, and direct downloading of PDF & DOC materials
 */

export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Pattern 1: /file/d/{id}
  const fileMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  // Pattern 2: id={id} or open?id={id}
  const queryMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) return queryMatch[1];

  // Pattern 3: docs.google.com/document/d/{id}
  const docMatch = cleanUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch && docMatch[1]) return docMatch[1];

  // Pattern 4: docs.google.com/spreadsheets/d/{id}
  const sheetMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch && sheetMatch[1]) return sheetMatch[1];

  // Pattern 5: docs.google.com/presentation/d/{id}
  const presMatch = cleanUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (presMatch && presMatch[1]) return presMatch[1];

  return null;
}

export function isGoogleDocsUrl(url: string): boolean {
  return /docs\.google\.com\/document/i.test(url);
}

export function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com/i.test(url);
}

/**
 * Returns a URL suitable for embedding in an <iframe> for viewing
 */
export function getDrivePreviewUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  const fileId = extractDriveFileId(cleanUrl);

  if (fileId) {
    if (isGoogleDocsUrl(cleanUrl)) {
      return `https://docs.google.com/document/d/${fileId}/preview`;
    }
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  // Fallback to Google Docs Web Viewer for public documents
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true`;
  }

  return cleanUrl;
}

/**
 * Returns a direct download URL that prompts file download
 */
export function getDriveDownloadUrl(url: string, fileFormat?: string): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  const fileId = extractDriveFileId(cleanUrl);

  if (fileId) {
    if (isGoogleDocsUrl(cleanUrl)) {
      const format = (fileFormat || '').toLowerCase().includes('doc') ? 'docx' : 'pdf';
      return `https://docs.google.com/document/d/${fileId}/export?format=${format}`;
    }
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return cleanUrl;
}

/**
 * Normalizes document format
 */
export function getFormatBadge(format?: string): { label: string; colorClass: string; bgClass: string } {
  const f = (format || 'pdf').toLowerCase();
  if (f === 'doc' || f === 'docx') {
    return {
      label: 'DOC / WORD',
      colorClass: 'text-blue-700 border-blue-200',
      bgClass: 'bg-blue-50 text-blue-700',
    };
  }
  if (f === 'ppt' || f === 'pptx') {
    return {
      label: 'PRESENTATION',
      colorClass: 'text-amber-700 border-amber-200',
      bgClass: 'bg-amber-50 text-amber-700',
    };
  }
  return {
    label: 'PDF DOCUMENT',
    colorClass: 'text-red-700 border-red-200',
    bgClass: 'bg-red-50 text-red-700',
  };
}
