import type { DateInput, IsoDate } from './types.js';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface Ymd {
  y: number;
  m: number;
  d: number;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

export function toIso({ y, m, d }: Ymd): IsoDate {
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

/** Interpreta `YYYY-MM-DD` o un `Date` (por sus componentes locales). Lanza si es inválida. */
export function parse(input: DateInput): Ymd {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) throw new RangeError('Fecha inválida: Invalid Date');
    return { y: input.getFullYear(), m: input.getMonth() + 1, d: input.getDate() };
  }
  const match = ISO.exec(input);
  if (!match) throw new RangeError(`Fecha inválida "${input}": se esperaba YYYY-MM-DD`);
  const ymd = { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  const probe = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  if (
    probe.getUTCFullYear() !== ymd.y ||
    probe.getUTCMonth() !== ymd.m - 1 ||
    probe.getUTCDate() !== ymd.d
  ) {
    throw new RangeError(`Fecha inválida "${input}": no existe en el calendario`);
  }
  return ymd;
}

export function normalize(input: DateInput): IsoDate {
  return toIso(parse(input));
}

function utcMs({ y, m, d }: Ymd): number {
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): Ymd {
  const dt = new Date(ms);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return toIso(fromUtcMs(utcMs(parse(iso)) + days * 86_400_000));
}

/** 0 = domingo … 6 = sábado. */
export function weekday(iso: IsoDate): number {
  return new Date(utcMs(parse(iso))).getUTCDay();
}

export function isWeekend(iso: IsoDate): boolean {
  const w = weekday(iso);
  return w === 0 || w === 6;
}

/** n-ésimo (1 = primero) día de la semana `wd` del mes `m` de `y`. */
export function nthWeekday(y: number, m: number, wd: number, n: number): IsoDate {
  const first = weekday(toIso({ y, m, d: 1 }));
  const offset = (wd - first + 7) % 7;
  return toIso({ y, m, d: 1 + offset + (n - 1) * 7 });
}

export function year(iso: IsoDate): number {
  return parse(iso).y;
}
