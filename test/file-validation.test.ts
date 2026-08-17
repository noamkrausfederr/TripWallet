import { describe, it, expect } from 'vitest';
import { isAllowedFile, MAX_FILE_SIZE, storageSafeFileName } from '../src/lib/fileHelpers';

describe('fileHelpers validation', () => {
  it('accepts allowed mime types and sizes', () => {
    const file = new File(['data'], 'a.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(isAllowedFile(file)).toBe(true);
  });

  it('rejects unsupported mime type', () => {
    const file = new File(['data'], 'a.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 1024 });
    expect(isAllowedFile(file)).toBe(false);
  });

  it('rejects files larger than MAX_FILE_SIZE', () => {
    const file = new File(['x'.repeat(10)], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });
    expect(isAllowedFile(file)).toBe(false);
  });

  it('makes storage filenames safe while preserving the extension', () => {
    expect(storageSafeFileName('Montenegro, bečići.jpg')).toBe('Montenegro-becici.jpg');
  });
});
