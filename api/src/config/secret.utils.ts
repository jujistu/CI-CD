import * as fs from 'fs';

export function readSecret(name: string): string | undefined {
  const path = `/etc/secrets/${name}`;

  try {
    return fs.readFileSync(path, 'utf-8').trim();
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Failed to read secret ${name}: ${err.message}`);
    }
    console.error(`Failed to read secret ${name}: unknown error`);
  }
  return undefined;
}
