import type { IsoDate, Source } from '../types.js';
import { SOURCES } from './sources.js';

export interface RmfEntry {
  /** Primer día (inclusive). */
  from: IsoDate;
  /** Último día (inclusive). */
  to: IsoDate;
  kind: 'rmf-day' | 'sat-vacation';
  name: string;
  fundamento: string;
  source: Source;
}

/**
 * Días inhábiles y periodos generales de vacaciones del SAT publicados en la regla 2.1.6
 * de la RMF de cada año y sus modificaciones. Solo lo que se verificó en el texto de la
 * fuente primaria.
 *
 * Sin publicar / sin verificar (por eso NO están aquí, ver SOURCES.md):
 * - Segundo periodo general de vacaciones 2024 (diciembre 2024 – enero 2025).
 * - Segundo periodo general de vacaciones 2026 (diciembre 2026 – enero 2027).
 * - Cualquier día inhábil de 2027.
 */
export const RMF_ENTRIES: readonly RmfEntry[] = [
  {
    from: '2025-04-17',
    to: '2025-04-18',
    kind: 'rmf-day',
    name: 'Días inhábiles para el SAT (17 y 18 de abril de 2025)',
    fundamento: 'RMF 2025, regla 2.1.6, fr. I',
    source: SOURCES.rmf2025,
  },
  {
    from: '2025-07-18',
    to: '2025-07-31',
    kind: 'sat-vacation',
    name: 'Primer periodo general de vacaciones 2025',
    fundamento: 'RMF 2025, regla 2.1.6, fr. I (4.ª Resolución de Modificaciones)',
    source: SOURCES.rmf2025Mod4,
  },
  {
    from: '2025-12-18',
    to: '2026-01-02',
    kind: 'sat-vacation',
    name: 'Segundo periodo general de vacaciones 2025',
    fundamento: 'RMF 2026, regla 2.1.6, fr. I',
    source: SOURCES.rmf2026,
  },
  {
    from: '2026-04-02',
    to: '2026-04-03',
    kind: 'rmf-day',
    name: 'Días inhábiles para el SAT (2 y 3 de abril de 2026)',
    fundamento: 'RMF 2026, regla 2.1.6, fr. II',
    source: SOURCES.rmf2026,
  },
  {
    from: '2026-07-20',
    to: '2026-07-31',
    kind: 'sat-vacation',
    name: 'Primer periodo general de vacaciones 2026',
    fundamento: 'RMF 2026, regla 2.1.6, fr. III (1.ª Resolución de Modificaciones)',
    source: SOURCES.rmf2026Mod1,
  },
];
