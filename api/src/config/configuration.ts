// src/config/configuration.ts
import { getConfig } from './env.utils';

export default () => ({
  database: {
    host: getConfig('DB_HOST'),
    port: parseInt(getConfig('DB_PORT') || '5432', 10),
    user: getConfig('DB_USER'),
    password: getConfig('DB_PASSWORD'),
    name: getConfig('DB_NAME'),
  },

  jwt: {
    secret: getConfig('JWT_SECRET'),
    expiresIn: getConfig('JWT_EXPIRES_IN'),
    refreshSecret: getConfig('JWT_REFRESH_SECRET'),
    refreshExpiresIn: getConfig('JWT_REFRESH_EXPIRES_IN'),
  },

  stripe: {
    secretKey: getConfig('STRIPE_SECRET_KEY'),
    webhookSecret: getConfig('STRIPE_WEBHOOK_SECRET'),
  },

  app: {
    port: parseInt(getConfig('PORT') || '3001', 10),
    nodeEnv: getConfig('NODE_ENV'),
    allowedOrigins: getConfig('ALLOWED_ORIGINS'),
  },
});
