import { addBusinessDays, nextBusinessDay, whyNotBusinessDay } from './calendar.js';
import { LAST_PUBLISHED_RMF_YEAR, SOURCES } from './data/sources.js';
import { toIso, weekday, year as yearOf } from './date.js';
import type { DueDate, DueDateOptions, MonthlyObligation, Source, Taxpayer } from './types.js';

const FRIDAY = 5;

interface Rule {
  fundamento: string;
  source: Source;
  /** Meses del periodo (1–12) en que la obligación existe. */
  months: readonly number[];
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
// El pago provisional de diciembre no existe: se sustituye por la declaración anual.
const JAN_TO_NOV = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** Todas vencen "a más tardar el día 17 del mes inmediato posterior". */
const MONTHLY: Record<MonthlyObligation, Rule> = {
  'isr-pagos-provisionales-pm': {
    fundamento: 'LISR art. 14, párr. 1',
    source: SOURCES.lisr,
    months: JAN_TO_NOV,
  },
  'isr-pagos-provisionales-pf': {
    fundamento: 'LISR art. 106, párr. 1',
    source: SOURCES.lisr,
    months: JAN_TO_NOV,
  },
  'isr-retenciones': {
    fundamento: 'LISR art. 96, último párr.',
    source: SOURCES.lisr,
    months: ALL_MONTHS,
  },
  iva: { fundamento: 'LIVA art. 5o.-D, último párr.', source: SOURCES.liva, months: ALL_MONTHS },
  diot: { fundamento: 'LIVA art. 32, fr. VIII', source: SOURCES.liva, months: ALL_MONTHS },
};

export const MONTHLY_OBLIGATIONS = Object.keys(MONTHLY) as MonthlyObligation[];

const CFF12_ROLL = 'CFF art. 12, párr. 5';

function parsePeriod(period: string): { y: number; m: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  const m = match ? Number(match[2]) : 0;
  if (!match || m < 1 || m > 12) {
    throw new RangeError(`Periodo inválido "${period}": se esperaba YYYY-MM`);
  }
  return { y: Number(match[1]), m };
}

/**
 * Recorre `nominal` al siguiente día hábil para presentar/pagar (`filing`: las
 * vacaciones generales del SAT cuentan como hábiles) y aplica, si se pide, la prórroga
 * del viernes para pagos en banco.
 */
function resolve(
  base: Pick<DueDate, 'obligation' | 'period' | 'nominal' | 'fundamento' | 'sources'>,
  options: DueDateOptions,
): DueDate {
  const opts = { purpose: 'filing' } as const;
  const reasons = whyNotBusinessDay(base.nominal, opts).map((r) => `${r.name} (${r.fundamento})`);
  let due = nextBusinessDay(base.nominal, opts);

  let bankFridayExtension = false;
  if (options.payAtBank && weekday(due) === FRIDAY) {
    due = addBusinessDays(due, 1, opts);
    bankFridayExtension = true;
    reasons.push(`Último día en viernes, pago ante institución de crédito (${CFF12_ROLL})`);
  }

  return {
    ...base,
    due,
    shifted: due !== base.nominal,
    shiftReasons: reasons,
    bankFridayExtension,
    projected: yearOf(due) > LAST_PUBLISHED_RMF_YEAR,
    sources: [...base.sources, SOURCES.cff],
    fundamento: [...base.fundamento, 'CFF art. 12, párr. 5'],
  };
}

/**
 * Vencimiento mensual del día 17 para el periodo `period` (`YYYY-MM`, el mes al que
 * corresponde el pago o la información). Vence el 17 del mes siguiente y, si ese día es
 * inhábil, se prorroga al siguiente día hábil (CFF art. 12, párr. 5).
 *
 * Las vacaciones generales del SAT cuentan como hábiles para declarar y pagar.
 *
 * Esta función no decide si estás obligado ni bajo qué régimen: solo calcula la fecha.
 */
export function monthlyDueDate(
  args: { obligation: MonthlyObligation; period: string },
  options: DueDateOptions = {},
): DueDate {
  const rule = MONTHLY[args.obligation];
  if (!rule) throw new RangeError(`Obligación desconocida "${String(args.obligation)}"`);
  const { y, m } = parsePeriod(args.period);
  if (!rule.months.includes(m)) {
    throw new RangeError(
      `"${args.obligation}" no tiene pago mensual para el periodo ${args.period}: ` +
        'el pago provisional de diciembre se sustituye por la declaración anual',
    );
  }
  const nominal = toIso(m === 12 ? { y: y + 1, m: 1, d: 17 } : { y, m: m + 1, d: 17 });
  return resolve(
    {
      obligation: args.obligation,
      period: args.period,
      nominal,
      fundamento: [rule.fundamento],
      sources: [rule.source],
    },
    options,
  );
}

/**
 * Declaración anual del ejercicio `year`:
 *
 * - `pm` (personas morales): dentro de los tres meses siguientes al cierre, es decir, a más
 *   tardar el 31 de marzo (LISR art. 9).
 * - `pf` (personas físicas): en el mes de abril, es decir, a más tardar el 30 de abril
 *   (LISR art. 150, párr. 1).
 */
export function annualDueDate(
  args: { year: number; taxpayer: Taxpayer },
  options: DueDateOptions = {},
): DueDate {
  if (!Number.isInteger(args.year)) throw new RangeError(`Ejercicio inválido: ${args.year}`);
  const isPm = args.taxpayer === 'pm';
  if (!isPm && args.taxpayer !== 'pf') {
    throw new RangeError(`taxpayer debe ser "pm" o "pf", se recibió "${String(args.taxpayer)}"`);
  }
  return resolve(
    {
      obligation: isPm ? 'declaracion-anual-pm' : 'declaracion-anual-pf',
      period: String(args.year),
      nominal: toIso({ y: args.year + 1, m: isPm ? 3 : 4, d: isPm ? 31 : 30 }),
      fundamento: [
        isPm
          ? 'LISR art. 9 ("dentro de los tres meses siguientes a la fecha en la que termine el ejercicio fiscal")'
          : 'LISR art. 150, párr. 1',
      ],
      sources: [SOURCES.lisr],
    },
    options,
  );
}

export interface FiscalCalendarOptions extends DueDateOptions {
  /** Limita las obligaciones mensuales incluidas. Por omisión, todas. */
  obligations?: readonly MonthlyObligation[];
}

/**
 * Todos los vencimientos que caen en el año natural `year`: los mensuales de los
 * periodos que vencen entre enero y diciembre de `year` y las declaraciones anuales del
 * ejercicio `year - 1`. Ordenados por fecha límite.
 */
export function fiscalCalendar(year: number, options: FiscalCalendarOptions = {}): DueDate[] {
  const obligations = options.obligations ?? MONTHLY_OBLIGATIONS;
  const out: DueDate[] = [];

  for (const obligation of obligations) {
    for (let m = 1; m <= 12; m += 1) {
      // Vence en `year` el periodo del mes anterior (diciembre viene del año previo).
      const period = m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, '0')}`;
      const periodMonth = m === 1 ? 12 : m - 1;
      if (!MONTHLY[obligation].months.includes(periodMonth)) continue;
      out.push(monthlyDueDate({ obligation, period }, options));
    }
  }

  out.push(annualDueDate({ year: year - 1, taxpayer: 'pm' }, options));
  out.push(annualDueDate({ year: year - 1, taxpayer: 'pf' }, options));

  return out.sort((a, b) => a.due.localeCompare(b.due) || a.obligation.localeCompare(b.obligation));
}
