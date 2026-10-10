import { env } from '../../config/env';
import { logger, maskPhone } from '../../utils/logger';

export interface OtpProvider {
  send(phone: string, otp: string): Promise<void>;
}

class ConsoleProvider implements OtpProvider {
  async send(phone: string, otp: string) {
    // The one place an OTP is intentionally printed (TRD section 9 rule 1). Phone stays masked.
    logger.info(`[OTP:console] login code for ${maskPhone(phone)} is ${otp}`);
  }
}

/** Fails fast at boot for providers that are not wired up yet (see docs/decisions.md D-12). */
export function getOtpProvider(): OtpProvider {
  if (env.OTP_PROVIDER === 'console') return new ConsoleProvider();
  throw new Error(
    `OTP_PROVIDER=${env.OTP_PROVIDER} is not implemented in this build. Use OTP_PROVIDER=console, or add a provider in modules/auth/otpProvider.ts.`,
  );
}
