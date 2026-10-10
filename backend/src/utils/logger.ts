// Tiny structured logger. Phone numbers and JWT-looking tokens are redacted (TRD section 15).
const PHONE_RE = /\+?\d[\d\s-]{8,}\d/g;
const JWT_RE = /eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g;

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '***';
  return `${phone.startsWith('+') ? '+' : ''}${digits.slice(0, 2)}${'*'.repeat(digits.length - 6)}${digits.slice(-4)}`;
}

export function redact(input: string): string {
  return input.replace(JWT_RE, '[token]').replace(PHONE_RE, (m) => maskPhone(m.trim()));
}

type Level = 'debug' | 'info' | 'warn' | 'error';
const quiet = () => process.env.NODE_ENV === 'test' && !process.env.LOG_IN_TESTS;

function write(level: Level, msg: string, extra?: unknown) {
  if (quiet() && level !== 'error') return;
  const line = `${new Date().toISOString()} ${level.toUpperCase()} ${redact(msg)}`;
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  if (extra === undefined) out(line);
  else
    out(
      line,
      typeof extra === 'string'
        ? redact(extra)
        : extra instanceof Error
          ? redact(extra.stack ?? extra.message)
          : extra,
    );
}

export const logger = {
  debug: (m: string, e?: unknown) => write('debug', m, e),
  info: (m: string, e?: unknown) => write('info', m, e),
  warn: (m: string, e?: unknown) => write('warn', m, e),
  error: (m: string, e?: unknown) => write('error', m, e),
};
