export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
export function integer(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535)
    throw new Error(`${name} must be a valid port`);
  return value;
}
export function apiKeys() {
  const write = required('API_WRITE_KEY');
  const read = required('API_READ_KEY');
  if (write.length < 32 || read.length < 32 || write === read)
    throw new Error('API keys must be distinct and at least 32 characters');
  return { write, read };
}
