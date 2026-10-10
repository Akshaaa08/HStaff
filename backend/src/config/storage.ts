import { createHmac, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export interface StorageDriver {
  readonly name: 'supabase' | 'local';
  upload(bucket: string, key: string, body: Buffer, contentType: string): Promise<void>;
  signedUrl(bucket: string, key: string, ttlSec: number): Promise<string>;
  publicUrl(bucket: string, key: string): string;
}

class SupabaseDriver implements StorageDriver {
  readonly name = 'supabase' as const;
  private client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  async upload(bucket: string, key: string, body: Buffer, contentType: string) {
    const { error } = await this.client.storage
      .from(bucket)
      .upload(key, body, { contentType, upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  }
  async signedUrl(bucket: string, key: string, ttlSec: number) {
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(key, ttlSec);
    if (error || !data) throw new Error(`Could not sign URL: ${error?.message ?? 'unknown'}`);
    return data.signedUrl;
  }
  publicUrl(bucket: string, key: string) {
    return this.client.storage.from(bucket).getPublicUrl(key).data.publicUrl;
  }
}

// Development/test fallback so the KYC flow works without a Supabase project. Never used in production
// (env validation requires Supabase there). Files land in ./.local-storage and are served via signed token URLs.
const LOCAL_ROOT = path.resolve(process.cwd(), '.local-storage');
const sign = (payload: string) =>
  createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('base64url');

class LocalDriver implements StorageDriver {
  readonly name = 'local' as const;
  private file(bucket: string, key: string) {
    const p = path.resolve(LOCAL_ROOT, bucket, key);
    if (!p.startsWith(LOCAL_ROOT + path.sep)) throw new Error('Invalid storage key');
    return p;
  }
  async upload(bucket: string, key: string, body: Buffer) {
    const p = this.file(bucket, key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, body);
  }
  async signedUrl(bucket: string, key: string, ttlSec: number) {
    const payload = Buffer.from(
      JSON.stringify({ b: bucket, k: key, e: Date.now() + ttlSec * 1000 }),
    ).toString('base64url');
    return `${env.API_PUBLIC_URL}/api/v1/dev-files/${payload}.${sign(payload)}`;
  }
  publicUrl(bucket: string, key: string) {
    return `${env.API_PUBLIC_URL}/api/v1/dev-files/public/${bucket}/${key}`;
  }
  async resolveToken(token: string): Promise<string | null> {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = sign(payload);
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      return null;
    const { b, k, e } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      b: string;
      k: string;
      e: number;
    };
    if (Date.now() > e) return null;
    return this.file(b, k);
  }
  resolvePublic(bucket: string, key: string): string | null {
    return bucket === env.SUPABASE_PUBLIC_BUCKET ? this.file(bucket, key) : null; // never the private bucket
  }
}

const useSupabase = !!env.SUPABASE_SERVICE_ROLE_KEY && !!env.SUPABASE_URL;
export const localDriver = new LocalDriver();
export const storage: StorageDriver = useSupabase ? new SupabaseDriver() : localDriver;

export const KYC_BUCKET = env.SUPABASE_KYC_BUCKET;
export const PUBLIC_BUCKET = env.SUPABASE_PUBLIC_BUCKET;
