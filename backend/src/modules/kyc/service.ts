import { randomUUID } from 'node:crypto';
import { db } from '../../config/db';
import { KYC_BUCKET, storage } from '../../config/storage';
import { assertFileSignature, extensionFor } from '../../middleware/upload';
import { badRequest, conflict } from '../../utils/errors';
import type { KycDocType } from '../../shared/enums';

const MAX_DOCS_PER_WORKER = 10;
export const KYC_URL_TTL_SEC = 300;

/** Uploads through the API with the service-role key; only the object key is stored, never a URL (TRD section 15). */
export async function uploadKycDocument(
  workerId: string,
  docType: KycDocType,
  file: Express.Multer.File | undefined,
) {
  if (!file) throw badRequest('FILE_REQUIRED', 'Attach a file in the "file" field');
  assertFileSignature(file);
  const [{ count }] = await db('kyc_documents')
    .where({ worker_id: workerId })
    .count<{ count: string }[]>('* as count');
  if (Number(count) >= MAX_DOCS_PER_WORKER)
    throw conflict('KYC_LIMIT', `You can upload at most ${MAX_DOCS_PER_WORKER} documents`);

  const key = `kyc/${workerId}/${randomUUID()}.${extensionFor(file.mimetype)}`;
  await storage.upload(KYC_BUCKET, key, file.buffer, file.mimetype);
  const [doc] = await db('kyc_documents')
    .insert({ worker_id: workerId, doc_type: docType, storage_key: key })
    .returning(['id', 'doc_type', 'created_at']);

  // Re-submission after the admin asked for more information puts the worker back in the review queue.
  await db('worker_profiles')
    .where({ user_id: workerId, verification: 'NEEDS_INFO' })
    .update({ verification: 'PENDING' });
  return doc;
}

export const listKycDocuments = (workerId: string) =>
  db('kyc_documents')
    .where({ worker_id: workerId })
    .orderBy('created_at', 'desc')
    .select('id', 'doc_type', 'created_at');

/** Short-lived signed URLs for the admin KYC viewer. Callers must already have enforced verifier/super_admin. */
export async function signedKycDocuments(workerId: string) {
  const docs = await db('kyc_documents')
    .where({ worker_id: workerId })
    .orderBy('created_at', 'desc')
    .select<{ id: string; doc_type: string; storage_key: string; created_at: Date }[]>();
  return Promise.all(
    docs.map(async (d) => ({
      id: d.id,
      doc_type: d.doc_type,
      created_at: d.created_at,
      url: await storage.signedUrl(KYC_BUCKET, d.storage_key, KYC_URL_TTL_SEC),
      url_expires_in_sec: KYC_URL_TTL_SEC,
    })),
  );
}
