import { formatBytes } from './formatters';

export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

const imageExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'heic',
  'heif',
  'webp',
  'gif',
  'bmp',
  'tif',
  'tiff',
  'avif',
]);
const videoExtensions = new Set([
  'mp4',
  'mov',
  'm4v',
  'webm',
  '3gp',
  '3g2',
  'avi',
  'mpg',
  'mpeg',
]);

const mimeTypesByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  avif: 'image/avif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  avi: 'video/x-msvideo',
  mpg: 'video/mpeg',
  mpeg: 'video/mpeg',
};

const turkishCharacterMap: Record<string, string> = {
  ç: 'c',
  Ç: 'C',
  ğ: 'g',
  Ğ: 'G',
  ı: 'i',
  İ: 'I',
  ö: 'o',
  Ö: 'O',
  ş: 's',
  Ş: 'S',
  ü: 'u',
  Ü: 'U',
};

export interface FileValidationResult {
  isValid: boolean;
  message: string;
}

export type UploadMediaKind = 'image' | 'video' | 'unknown';

export function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return extension === fileName.toLowerCase() ? '' : extension;
}

export function getUploadMediaKind(file: File): UploadMediaKind {
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  const extension = getFileExtension(file.name);

  if (imageExtensions.has(extension)) {
    return 'image';
  }

  if (videoExtensions.has(extension)) {
    return 'video';
  }

  return 'unknown';
}

export function inferUploadMimeType(file: File) {
  const existingMimeType = file.type.toLowerCase().trim();

  if (
    existingMimeType.startsWith('image/') ||
    existingMimeType.startsWith('video/')
  ) {
    return existingMimeType === 'image/jpg' ? 'image/jpeg' : existingMimeType;
  }

  const extension = getFileExtension(file.name);
  return mimeTypesByExtension[extension] ?? 'application/octet-stream';
}

export function validateUploadFile(file: File): FileValidationResult {
  const mediaKind = getUploadMediaKind(file);

  if (mediaKind === 'unknown') {
    return {
      isValid: false,
      message:
        'Sadece fotoğraf veya video yükleyebilirsiniz. Desteklenen örnekler: JPG, JPEG, PNG, HEIC, HEIF, WEBP, MP4, MOV.',
    };
  }

  if (mediaKind === 'image' && file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      isValid: false,
      message: `Fotoğraf boyutu en fazla ${formatBytes(MAX_PHOTO_SIZE_BYTES)} olabilir.`,
    };
  }

  if (mediaKind === 'video' && file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      isValid: false,
      message: `Video boyutu en fazla ${formatBytes(MAX_VIDEO_SIZE_BYTES)} olabilir.`,
    };
  }

  return {
    isValid: true,
    message: 'Yüklemeye hazır.',
  };
}

export function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const withoutTurkishCharacters = trimmed.replace(
    /[çÇğĞıİöÖşŞüÜ]/g,
    (character) => turkishCharacterMap[character] ?? character,
  );
  const normalized = withoutTurkishCharacters
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  const safeName = normalized
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '');

  return safeName || 'dosya';
}
