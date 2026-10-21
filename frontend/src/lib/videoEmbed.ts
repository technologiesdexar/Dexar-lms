export interface VideoEmbedInfo {
  type: 'iframe' | 'video';
  embedUrl: string;
  originalUrl: string;
  provider: string;
  isGoogleDrive: boolean;
  isValid: boolean;
}

/**
 * Resolves any video URL into a playable stream URL or embeddable iframe URL.
 * Automatically handles Google Drive, YouTube, Vimeo, Dropbox, AWS S3, Cloudinary,
 * Firebase Storage, and direct MP4/WebM cloud storage URLs.
 */
export function resolveVideoEmbed(url: string | null | undefined): VideoEmbedInfo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      type: 'iframe',
      embedUrl: '',
      originalUrl: '',
      provider: 'Unknown',
      isGoogleDrive: false,
      isValid: false,
    };
  }

  const cleanUrl = url.trim();

  // 1. Google Drive Links
  // Handles:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/file/d/FILE_ID/view
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://docs.google.com/file/d/FILE_ID/edit
  const gDriveMatch = cleanUrl.match(
    /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=|drive\.google\.com\/uc\?id=|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/
  );

  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return {
      type: 'iframe',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      originalUrl: cleanUrl,
      provider: 'Google Drive',
      isGoogleDrive: true,
      isValid: true,
    };
  }

  // 2. YouTube Links
  const ytMatch = cleanUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      originalUrl: cleanUrl,
      provider: 'YouTube',
      isGoogleDrive: false,
      isValid: true,
    };
  }

  // 3. Vimeo Links
  const vimeoMatch = cleanUrl.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      originalUrl: cleanUrl,
      provider: 'Vimeo',
      isGoogleDrive: false,
      isValid: true,
    };
  }

  // 4. Dropbox Links
  if (cleanUrl.includes('dropbox.com')) {
    let directUrl = cleanUrl;
    if (directUrl.includes('dl=0')) {
      directUrl = directUrl.replace('dl=0', 'raw=1');
    } else if (!directUrl.includes('raw=1')) {
      directUrl += directUrl.includes('?') ? '&raw=1' : '?raw=1';
    }
    return {
      type: 'video',
      embedUrl: directUrl,
      originalUrl: cleanUrl,
      provider: 'Dropbox',
      isGoogleDrive: false,
      isValid: true,
    };
  }

  // 5. Direct Video Files (.mp4, .webm, .ogg, .mov, .m4v) or Cloud Storage
  // S3, Cloudinary, Firebase Storage, Supabase, Azure Blob, etc.
  const isDirectVideo =
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(cleanUrl) ||
    cleanUrl.includes('res.cloudinary.com') ||
    cleanUrl.includes('firebasestorage.googleapis.com') ||
    cleanUrl.includes('storage.googleapis.com') ||
    cleanUrl.includes('.s3.') ||
    cleanUrl.includes('s3.amazonaws.com') ||
    cleanUrl.includes('.supabase.co/storage') ||
    cleanUrl.includes('.blob.core.windows.net');

  if (isDirectVideo) {
    return {
      type: 'video',
      embedUrl: cleanUrl,
      originalUrl: cleanUrl,
      provider: cleanUrl.includes('s3') ? 'Amazon S3' : cleanUrl.includes('cloudinary') ? 'Cloudinary' : 'Cloud Video (Direct MP4)',
      isGoogleDrive: false,
      isValid: true,
    };
  }

  // 6. Generic Embed Fallback (Iframe)
  return {
    type: 'iframe',
    embedUrl: cleanUrl,
    originalUrl: cleanUrl,
    provider: 'Embedded Player',
    isGoogleDrive: false,
    isValid: true,
  };
}
