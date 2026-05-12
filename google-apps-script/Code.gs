const FOLDER_ID = 'GOOGLE_DRIVE_KLASOR_IDINIZ';

const MIME_TYPES_BY_EXTENSION = {
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

function doGet() {
  return createJsonResponse({
    status: 'ok',
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('İstek gövdesi boş.');
    }

    const folderId = getFolderId(FOLDER_ID);

    if (!folderId) {
      throw new Error('Apps Script içindeki FOLDER_ID değeri güncellenmemiş.');
    }

    const body = JSON.parse(e.postData.contents);
    const guestName = sanitizeName(body.guestName || 'misafir') || 'misafir';
    const originalFileName = sanitizeFileName(body.fileName || 'dosya');
    const mimeType = normalizeMimeType(body.mimeType, originalFileName);
    const base64Data = stripDataUrlPrefix(String(body.base64Data || ''));

    if (!isAllowedMediaMimeType(mimeType)) {
      throw new Error(
        'Sadece fotoğraf veya video dosyaları kabul edilir. JPG, JPEG, PNG, HEIC, HEIF, WEBP, MP4 ve MOV desteklenir.',
      );
    }

    if (!base64Data) {
      throw new Error('Dosya verisi boş.');
    }

    const folder = DriveApp.getFolderById(folderId);
    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'Europe/Istanbul',
      'yyyy-MM-dd_HH-mm-ss',
    );
    const savedFileName = `${timestamp}_${guestName}_${originalFileName}`;
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, savedFileName);
    const file = folder.createFile(blob);

    return createJsonResponse({
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: file.getName(),
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error && error.message ? error.message : 'Yükleme tamamlanamadı.',
    });
  }
}

function doOptions() {
  return createJsonResponse({
    status: 'ok',
  });
}

function createJsonResponse(payload) {
  // ContentService custom CORS header set edemez. Frontend JSON'u text/plain
  // olarak gönderdiği için tarayıcı preflight yapmadan doPost'a ulaşabilir.
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function stripDataUrlPrefix(base64Data) {
  const commaIndex = base64Data.indexOf(',');
  return commaIndex >= 0 ? base64Data.slice(commaIndex + 1) : base64Data;
}

function getFolderId(value) {
  const folderValue = String(value || '').trim();

  if (!folderValue || folderValue === 'GOOGLE_DRIVE_KLASOR_IDINIZ') {
    return '';
  }

  const urlMatch = folderValue.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  return folderValue;
}

function normalizeMimeType(mimeType, fileName) {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase();

  if (
    normalizedMimeType &&
    normalizedMimeType !== 'application/octet-stream' &&
    normalizedMimeType !== 'binary/octet-stream'
  ) {
    return normalizedMimeType === 'image/jpg' ? 'image/jpeg' : normalizedMimeType;
  }

  const extension = getFileExtension(fileName);
  return MIME_TYPES_BY_EXTENSION[extension] || normalizedMimeType;
}

function isAllowedMediaMimeType(mimeType) {
  return (
    typeof mimeType === 'string' &&
    (mimeType.indexOf('image/') === 0 || mimeType.indexOf('video/') === 0)
  );
}

function getFileExtension(fileName) {
  const match = String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

function sanitizeName(value) {
  return transliterateTurkish(String(value))
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 80);
}

function sanitizeFileName(value) {
  const safeName = transliterateTurkish(String(value))
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 140);

  return safeName || 'dosya';
}

function transliterateTurkish(value) {
  const replacements = {
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

  return value
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (character) => replacements[character] || character)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}
