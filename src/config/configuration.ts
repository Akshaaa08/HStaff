export const configuration = () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  firebaseServiceAccountPath:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
  jwtSecret: process.env.JWT_SECRET || 'hourly-jwt-development-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
});
