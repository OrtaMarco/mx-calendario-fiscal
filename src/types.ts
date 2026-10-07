/** Fecha de calendario `YYYY-MM-DD` (sin hora ni zona horaria). */
export type IsoDate = string;

/**
 * Entrada de fecha. Un `string` debe ser `YYYY-MM-DD`. Un `Date` se interpreta por sus
 * componentes de calendario *locales* (año, mes y día tal como los ves en la zona horaria
 * del proceso), no por su instante UTC.
 */
export type DateInput = string | Date;

/**
 * Para qué se cuenta el día:
 *
 * - `procedure`: plazos de trámites, requerimientos, notificaciones y demás actos ante el
 *   SAT. Las vacaciones generales del SAT no se cuentan.
 * - `filing`: presentar declaraciones y pagar contribuciones. Por CFF art. 12, párrafo 2,
 *   las vacaciones generales del SAT se consideran hábiles.
 */
export type Purpose = 'procedure' | 'filing';

export interface Source {
  /** Nombre legible del documento. */
  label: string;
  /** URL de la fuente primaria (DOF, sat.gob.mx, diputados.gob.mx). */
  url: string;
}

export type NonBusinessKind =
  | 'weekend'
  | 'cff-holiday'
  | 'rmf-day'
  | 'sat-vacation'
  | 'lft-holiday';

export interface NonBusinessDay {
  date: IsoDate;
  name: string;
  kind: NonBusinessKind;
  /** Fundamento legal citado, p. ej. `CFF art. 12, párr. 1`. */
  fundamento: string;
  source: Source;
  /**
   * `true` cuando la fecha se obtiene aplicando una regla de ley a un año para el que la
   * RMF aún no está publicada: la ley la fija, pero la RMF de ese año podría añadir más
   * días inhábiles.
   */
  projected: boolean;
  /** `false` para días que no cuentan en trámites pero sí para declarar y pagar. */
  appliesToFiling: boolean;
}

export interface BusinessDayOptions {
  /** Por omisión `procedure`, el cómputo más estricto. */
  purpose?: Purpose;
}

export type MonthlyObligation =
  | 'isr-pagos-provisionales-pm'
  | 'isr-pagos-provisionales-pf'
  | 'isr-retenciones'
  | 'iva'
  | 'diot';

export type Taxpayer = 'pm' | 'pf';

export interface DueDateOptions {
  /**
   * Si el pago se hace ante una institución de crédito autorizada y el último día del
   * plazo es viernes, el plazo se prorroga al siguiente día hábil (CFF art. 12, párr. 5).
   * Por omisión `false`.
   */
  payAtBank?: boolean;
}

export interface DueDate {
  /** Etiqueta de la obligación. */
  obligation: MonthlyObligation | 'declaracion-anual-pm' | 'declaracion-anual-pf';
  /** `YYYY-MM` del periodo (mensuales) o `YYYY` del ejercicio (anuales). */
  period: string;
  /** Fecha que fija la ley antes de cualquier recorrido. */
  nominal: IsoDate;
  /** Fecha límite efectiva tras recorrer a día hábil. */
  due: IsoDate;
  /** `true` si `due` es distinto de `nominal`. */
  shifted: boolean;
  /** Por qué se recorrió la fecha nominal (vacío si no se recorrió). */
  shiftReasons: string[];
  /** `true` si el viernes bancario movió la fecha. */
  bankFridayExtension: boolean;
  /** `true` si el año de `due` no tiene RMF publicada. */
  projected: boolean;
  fundamento: string[];
  sources: Source[];
}
