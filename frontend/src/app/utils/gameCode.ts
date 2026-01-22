export function normalizeGameCode(input: string): string {
  return input.replace(/[^A-Z]/gi, '').toUpperCase();
}

export function formatGameCode(input: string): string {
  const raw = normalizeGameCode(input);
  if (raw.length <= 4) return raw;
  return `${raw.slice(0, 4)} ${raw.slice(4, 8)}`;
}
