import { readSecret } from './secret.utils';

export function getConfig(key: string): string {
  return (
    process.env[key] || // local/dev fallback
    readSecret(key) || // production (k8s secret)
    ''
  );
}
