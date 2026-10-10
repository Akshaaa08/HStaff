import multer from 'multer';
import { badRequest } from '../utils/errors';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const storage = multer.memoryStorage();
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!ALLOWED.has(file.mimetype))
    return cb(badRequest('UNSUPPORTED_FILE_TYPE', 'Only JPG, PNG, WebP or PDF files are accepted'));
  cb(null, true);
};
const base = { storage, fileFilter, limits: { fileSize: MAX_BYTES, files: 3 } };

export const uploadOne = (field: string) => multer(base).single(field);
export const uploadMany = (field: string, max: number) => multer(base).array(field, max);

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
export const extensionFor = (mime: string) => EXT[mime] ?? 'bin';

/** The declared mimetype is client-controlled, so check the file's own magic bytes as well. */
export function assertFileSignature(file: Express.Multer.File): void {
  const b = file.buffer;
  const ok =
    (file.mimetype === 'image/jpeg' && b[0] === 0xff && b[1] === 0xd8) ||
    (file.mimetype === 'image/png' && b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) ||
    (file.mimetype === 'image/webp' &&
      b.subarray(0, 4).toString() === 'RIFF' &&
      b.subarray(8, 12).toString() === 'WEBP') ||
    (file.mimetype === 'application/pdf' && b.subarray(0, 4).toString() === '%PDF');
  if (!ok) throw badRequest('INVALID_FILE', 'File content does not match its declared type');
}
