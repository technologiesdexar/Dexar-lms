/**
 * Utility to normalize video URLs from Google Drive, YouTube, Dropbox, and cloud services
 * to ensure they are immediately embeddable and playable across devices.
 */
function normalizeVideoUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let clean = url.trim();

  // 1. Google Drive URLs
  // Handles:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  // https://docs.google.com/file/d/FILE_ID/edit
  const gDriveMatch = clean.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=|drive\.google\.com\/uc\?id=|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    return `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`;
  }

  // 2. YouTube URLs
  // Handles:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // 3. Dropbox links
  if (clean.includes('dropbox.com')) {
    if (clean.includes('dl=0')) {
      return clean.replace('dl=0', 'raw=1');
    }
    if (!clean.includes('raw=1')) {
      clean += clean.includes('?') ? '&raw=1' : '?raw=1';
      return clean;
    }
  }

  // 4. Vimeo links
  const vimeoMatch = clean.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return clean;
}

module.exports = { normalizeVideoUrl };
