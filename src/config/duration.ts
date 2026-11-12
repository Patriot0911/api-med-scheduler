const UNIT_SECONDS: Record<string, number> = {
  '': 1,
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
};

/** Seconds from an env value like `900`, `15m`, `12h` or `7d`; an invalid value stops the app instead of falling back silently */
export const parseDurationSeconds = (name: string, fallbackSeconds: number): number => {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallbackSeconds;
  }
  const match = /^(\d+)\s*([smhd]?)$/i.exec(raw);
  if (!match) {
    throw new Error(`${name}="${raw}" is not a valid duration: use seconds or a number with s / m / h / d, e.g. 15m`);
  }
  return Number(match[1]) * UNIT_SECONDS[match[2].toLowerCase()];
};
