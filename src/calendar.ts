import { addDays, isWeekend, normalize, year as yearOf } from './date.js';
import { cffHolidays, lftHolidays } from './data/holidays.js';
import { RMF_ENTRIES } from './data/rmf.js';
import { LAST_PUBLISHED_RMF_YEAR, SOURCES } from './data/sources.js';
import type { BusinessDayOptions, DateInput, IsoDate, NonBusinessDay, Purpose } from './types.js';

const cache = new Map<number, NonBusinessDay[]>();

function build(year: number): NonBusinessDay[] {
  const projected = year > LAST_PUBLISHED_RMF_YEAR;
  const days: NonBusinessDay[] = [];

  for (const h of cffHolidays(year)) {
    days.push({
      date: h.date,
      name: h.name,
      kind: 'cff-holiday',
      fundamento: h.fundamento,
      source: SOURCES.cff,
      projected,
      appliesToFiling: true,
    });
  }

  for (const entry of RMF_ENTRIES) {
    const isFiling = entry.kind === 'rmf-day';
    let cursor = entry.from;
    while (cursor <= entry.to) {
      if (yearOf(cursor) === year) {
        days.push({
          date: cursor,
          name: entry.name,
          kind: entry.kind,
          fundamento: entry.fundamento,
          source: entry.source,
          projected: false,
          // Vacaciones generales: hábiles para declarar y pagar (CFF 12, párr. 2).
          appliesToFiling: isFiling,
        });
      }
      cursor = addDays(cursor, 1);
    }
  }

  return days.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
}

function forYear(year: number): NonBusinessDay[] {
  let days = cache.get(year);
  if (!days) {
    days = build(year);
    cache.set(year, days);
  }
  return days;
}

function applies(day: NonBusinessDay, purpose: Purpose): boolean {
  return purpose === 'procedure' || day.appliesToFiling;
}

/**
 * Días inhábiles fiscales de `year` que no son sábado ni domingo: días de CFF art. 12
 * párr. 1, días inhábiles de la RMF 2.1.6 y, si `purpose` es `procedure` (por omisión),
 * los periodos generales de vacaciones del SAT. Cada día lleva su fundamento y fuente.
 *
 * Si un día coincide con dos fundamentos aparece una vez por cada uno.
 */
export function getNonBusinessDays(year: number, options: BusinessDayOptions = {}): NonBusinessDay[] {
  const purpose = options.purpose ?? 'procedure';
  return forYear(year)
    .filter((d) => applies(d, purpose))
    .map((d) => ({ ...d }));
}

/**
 * Motivos por los que `date` no es día hábil (vacío si lo es). Los fines de semana se
 * devuelven como un motivo sintético con fundamento CFF art. 12, párr. 1.
 */
export function whyNotBusinessDay(date: DateInput, options: BusinessDayOptions = {}): NonBusinessDay[] {
  const iso = normalize(date);
  const purpose = options.purpose ?? 'procedure';
  const reasons = forYear(yearOf(iso))
    .filter((d) => d.date === iso && applies(d, purpose))
    .map((d) => ({ ...d }));
  if (isWeekend(iso)) {
    reasons.unshift({
      date: iso,
      name: 'Sábado o domingo',
      kind: 'weekend',
      fundamento: 'CFF art. 12, párr. 1',
      source: SOURCES.cff,
      projected: false,
      appliesToFiling: true,
    });
  }
  return reasons;
}

export function isBusinessDay(date: DateInput, options: BusinessDayOptions = {}): boolean {
  return whyNotBusinessDay(date, options).length === 0;
}

/** Primer día hábil igual o posterior a `date` (el mismo día si ya es hábil). */
export function nextBusinessDay(date: DateInput, options: BusinessDayOptions = {}): IsoDate {
  let cursor = normalize(date);
  while (!isBusinessDay(cursor, options)) cursor = addDays(cursor, 1);
  return cursor;
}

/** Primer día hábil igual o anterior a `date` (el mismo día si ya es hábil). */
export function previousBusinessDay(date: DateInput, options: BusinessDayOptions = {}): IsoDate {
  let cursor = normalize(date);
  while (!isBusinessDay(cursor, options)) cursor = addDays(cursor, -1);
  return cursor;
}

/**
 * Cuenta `n` días hábiles a partir de `date`, sin contar `date` mismo (el día 1 es el
 * primer día hábil posterior). Con `n` negativo cuenta hacia atrás. `n = 0` devuelve
 * `date` normalizada, sin recorrerla.
 */
export function addBusinessDays(date: DateInput, n: number, options: BusinessDayOptions = {}): IsoDate {
  if (!Number.isInteger(n)) throw new RangeError(`n debe ser entero, se recibió ${n}`);
  let cursor = normalize(date);
  const step = n < 0 ? -1 : 1;
  let remaining = Math.abs(n);
  while (remaining > 0) {
    cursor = addDays(cursor, step);
    if (isBusinessDay(cursor, options)) remaining -= 1;
  }
  return cursor;
}

/** Días de descanso obligatorio de la LFT art. 74 (fr. I–VIII) para `year`. */
export function laborHolidays(year: number): NonBusinessDay[] {
  const projected = year > LAST_PUBLISHED_RMF_YEAR;
  return lftHolidays(year).map((h) => ({
    date: h.date,
    name: h.name,
    kind: 'lft-holiday' as const,
    fundamento: h.fundamento,
    source: SOURCES.lft,
    projected,
    appliesToFiling: false,
  }));
}

/** `true` si `date` es día de descanso obligatorio de la LFT art. 74 (fr. I–VIII). */
export function isLaborHoliday(date: DateInput): boolean {
  const iso = normalize(date);
  return laborHolidays(yearOf(iso)).some((h) => h.date === iso);
}
