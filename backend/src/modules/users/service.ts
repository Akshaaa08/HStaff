import { randomUUID } from 'node:crypto';
import { db } from '../../config/db';
import { PUBLIC_BUCKET, storage } from '../../config/storage';
import { assertFileSignature, extensionFor } from '../../middleware/upload';
import { badRequest, conflict, notFound } from '../../utils/errors';
import { publicUser } from '../auth/service';
import type { UpdateMeBody } from './schema';

export async function getMe(userId: string) {
  const u = await db('users').where({ id: userId }).first();
  if (!u) throw notFound('User not found');
  return publicUser(u);
}

export async function updateMe(userId: string, patch: UpdateMeBody) {
  try {
    const [u] = await db('users').where({ id: userId }).update(patch).returning('*');
    return publicUser(u);
  } catch (err) {
    if ((err as { code?: string }).code === '23505')
      throw conflict('EMAIL_TAKEN', 'That email is already in use');
    throw err;
  }
}

export async function uploadProfilePhoto(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw badRequest('FILE_REQUIRED', 'Attach an image in the "photo" field');
  if (!file.mimetype.startsWith('image/'))
    throw badRequest('UNSUPPORTED_FILE_TYPE', 'Profile photos must be images');
  assertFileSignature(file);
  const key = `users/${userId}/${randomUUID()}.${extensionFor(file.mimetype)}`;
  await storage.upload(PUBLIC_BUCKET, key, file.buffer, file.mimetype);
  const photo_url = storage.publicUrl(PUBLIC_BUCKET, key);
  await db('users').where({ id: userId }).update({ photo_url });
  return { photo_url };
}
