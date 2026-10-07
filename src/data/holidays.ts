import { nthWeekday, toIso } from '../date.js';
import type { IsoDate } from '../types.js';

const MONDAY = 1;

/** Año del último relevo del Ejecutivo Federal (1 de octubre de 2024). */
const LAST_TRANSMISSION_YEAR = 2024;

/** `true` si en `year` corresponde la transmisión del Poder Ejecutivo (cada 6 años). */
export function isTransmissionYear(year: number): boolean {
  return year >= LAST_TRANSMISSION_YEAR && (year - LAST_TRANSMISSION_YEAR) % 6 === 0;
}

export interface LawDay {
  date: IsoDate;
  name: string;
  /** Fracción o párrafo citado. */
  fundamento: string;
}

/**
 * CFF art. 12, párrafo 1. Texto verificado en la edición con última reforma DOF 09-04-2026.
 * Nótese: incluye el 5 de mayo y fija el relevo presidencial el 1 de DICIEMBRE (la LFT usa
 * el 1 de octubre).
 */
export function cffHolidays(year: number): LawDay[] {
  const f = 'CFF art. 12, párr. 1';
  const days: LawDay[] = [
    { date: toIso({ y: year, m: 1, d: 1 }), name: 'Año Nuevo', fundamento: f },
    {
      date: nthWeekday(year, 2, MONDAY, 1),
      name: 'Día de la Constitución (primer lunes de febrero)',
      fundamento: f,
    },
    {
      date: nthWeekday(year, 3, MONDAY, 3),
      name: 'Natalicio de Benito Juárez (tercer lunes de marzo)',
      fundamento: f,
    },
    { date: toIso({ y: year, m: 5, d: 1 }), name: 'Día del Trabajo', fundamento: f },
    { date: toIso({ y: year, m: 5, d: 5 }), name: 'Batalla de Puebla (5 de mayo)', fundamento: f },
    { date: toIso({ y: year, m: 9, d: 16 }), name: 'Día de la Independencia', fundamento: f },
    {
      date: nthWeekday(year, 11, MONDAY, 3),
      name: 'Día de la Revolución (tercer lunes de noviembre)',
      fundamento: f,
    },
  ];
  if (isTransmissionYear(year)) {
    days.push({
      date: toIso({ y: year, m: 12, d: 1 }),
      name: 'Transmisión del Poder Ejecutivo (1 de diciembre, cada 6 años)',
      fundamento: f,
    });
  }
  days.push({ date: toIso({ y: year, m: 12, d: 25 }), name: 'Navidad', fundamento: f });
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * LFT art. 74, fracciones I–VIII. Texto verificado en la edición con última reforma
 * DOF 14-05-2026 (fracción VII reformada DOF 30-09-2024: 1 de octubre).
 *
 * La fracción IX (jornadas electorales ordinarias) depende de leyes electorales y no se
 * incluye; ver SOURCES.md.
 */
export function lftHolidays(year: number): LawDay[] {
  const fr = (n: string): string => `LFT art. 74, fr. ${n}`;
  const days: LawDay[] = [
    { date: toIso({ y: year, m: 1, d: 1 }), name: 'Año Nuevo', fundamento: fr('I') },
    {
      date: nthWeekday(year, 2, MONDAY, 1),
      name: 'Día de la Constitución (primer lunes de febrero)',
      fundamento: fr('II'),
    },
    {
      date: nthWeekday(year, 3, MONDAY, 3),
      name: 'Natalicio de Benito Juárez (tercer lunes de marzo)',
      fundamento: fr('III'),
    },
    { date: toIso({ y: year, m: 5, d: 1 }), name: 'Día del Trabajo', fundamento: fr('IV') },
    { date: toIso({ y: year, m: 9, d: 16 }), name: 'Día de la Independencia', fundamento: fr('V') },
    {
      date: nthWeekday(year, 11, MONDAY, 3),
      name: 'Día de la Revolución (tercer lunes de noviembre)',
      fundamento: fr('VI'),
    },
  ];
  if (isTransmissionYear(year)) {
    days.push({
      date: toIso({ y: year, m: 10, d: 1 }),
      name: 'Transmisión del Poder Ejecutivo (1 de octubre, cada 6 años)',
      fundamento: fr('VII'),
    });
  }
  days.push({ date: toIso({ y: year, m: 12, d: 25 }), name: 'Navidad', fundamento: fr('VIII') });
  return days.sort((a, b) => a.date.localeCompare(b.date));
}
