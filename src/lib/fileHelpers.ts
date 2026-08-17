export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

export function isAllowedFile(file: File | null | undefined) {
  if (!file) return false;
  return ALLOWED_MIME.includes(file.type) && file.size <= MAX_FILE_SIZE;
}

export function fileExtension(fileName: string) {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : '';
}

// Store a safe object key, while keeping the original filename for display.
export function storageSafeFileName(fileName: string) {
  const safeName = fileName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safeName || 'upload';
}
