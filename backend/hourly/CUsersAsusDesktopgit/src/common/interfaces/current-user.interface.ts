export interface CurrentUserPayload {
  userId: string;
  phone: string;
  role: 'client' | 'worker' | 'admin';
  name?: string;
}
