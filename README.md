# mx-calendario-fiscal

Mexican tax-calendar and business-day logic in TypeScript, with **zero runtime dependencies**.
Every rule and every date carries its legal basis and a link to the primary source.

> **Disclaimer / Aviso legal.** This is a support tool, **not tax or legal advice**. Dates
> depend on laws and on resolutions the SAT may change at any time. Verify against the
> primary sources (linked in [`SOURCES.md`](SOURCES.md)) or with a qualified professional
> before relying on a date. *Herramienta de apoyo; no constituye asesoría fiscal ni legal.*

[Versión en español](README.es.md) · [Sources](SOURCES.md) · [Design](DESIGN.md)

## Why

A Mexican tax deadline is not "the 17th". It is the 17th, moved to the next business day,
where "business day" is defined by *three different documents* that disagree with each other:

- **CFF art. 12** – days that never count (weekends, movable Mondays, May 5, …).
- **RMF rule 2.1.6** – extra days and general vacation periods that the SAT declares
  non-working, which **do not** stop the clock for filing returns and paying (CFF 12, par. 2).
- **LFT art. 74** – mandatory rest days for labor purposes. Not the same list: May 5 is
  non-working for tax purposes but not for labor, and the presidential handover is
  1 December in the CFF but 1 October in the LFT.

This library keeps those sets separate and tells you *why* a day is non-working.

Existing npm packages only cover the labor list (e.g. `mexico-holidays`, LFT art. 74). None
that I found covers CFF 12 + RMF + recurring tax due dates.

## Install

```sh
npm install mx-calendario-fiscal
```

Node ≥ 18. ESM and CommonJS. Types included. Not yet published to npm.

## Usage

```ts
import {
  isBusinessDay,
  nextBusinessDay,
  addBusinessDays,
  monthlyDueDate,
  annualDueDate,
  whyNotBusinessDay,
} from 'mx-calendario-fiscal';

// 17 Nov 2025 is the third Monday of November: non-working (CFF art. 12).
isBusinessDay('2025-11-17'); // false
nextBusinessDay('2025-11-17'); // '2025-11-18'

// IVA for October 2025: the 17th falls on a holiday, so it moves to the 18th.
const iva = monthlyDueDate({ obligation: 'iva', period: '2025-10' });
iva.nominal; // '2025-11-17'
iva.due; // '2025-11-18'
iva.shiftReasons; // ['Día de la Revolución (tercer lunes de noviembre) (CFF art. 12, párr. 1)']
iva.fundamento; // ['LIVA art. 5o.-D, último párr.', 'CFF art. 12, párr. 5']

// Annual return, individuals (fiscal year 2025): 30 April 2026.
annualDueDate({ year: 2025, taxpayer: 'pf' }).due; // '2026-04-30'
```

### Procedures vs. filing

SAT general vacation periods do not stop the clock for **filing returns and paying**, but
they do for procedures, requirements and notices. Pick with `purpose`:

```ts
// SAT vacation 18–31 July 2025.
addBusinessDays('2025-07-17', 1); // '2025-08-01'  (procedure, default)
addBusinessDays('2025-07-17', 1, { purpose: 'filing' }); // '2025-07-18'

whyNotBusinessDay('2025-07-22')[0].fundamento;
// 'RMF 2025, regla 2.1.6, fr. I (4.ª Resolución de Modificaciones)'
```

Due-date functions always use `filing`.

### Bank-payment Friday rule

If you pay at a bank and the last day is a Friday, CFF art. 12 (par. 5) extends it to the
next business day. Opt in with `payAtBank`:

```ts
annualDueDate({ year: 2026, taxpayer: 'pf' }).due; // '2027-04-30' (Friday)
annualDueDate({ year: 2026, taxpayer: 'pf' }, { payAtBank: true }).due; // '2027-05-03'
```

## API

| Function | Returns |
|---|---|
| `isBusinessDay(date, { purpose? })` | `boolean` |
| `nextBusinessDay(date, { purpose? })` / `previousBusinessDay(...)` | `YYYY-MM-DD` (same day if already a business day) |
| `addBusinessDays(date, n, { purpose? })` | `YYYY-MM-DD`; day 0 is `date`, negative `n` counts back |
| `whyNotBusinessDay(date, { purpose? })` | reasons with `fundamento` and `source` (empty if business day) |
| `getNonBusinessDays(year, { purpose? })` | non-weekend non-working days with legal basis |
| `laborHolidays(year)` / `isLaborHoliday(date)` | LFT art. 74 rest days |
| `monthlyDueDate({ obligation, period }, { payAtBank? })` | `DueDate` for the 17th |
| `annualDueDate({ year, taxpayer }, { payAtBank? })` | `DueDate` (`pm`: 31 Mar, `pf`: 30 Apr) |
| `fiscalCalendar(year, { obligations?, payAtBank? })` | all due dates falling in `year`, sorted |

`obligation` is one of `isr-pagos-provisionales-pm` (LISR 14), `isr-pagos-provisionales-pf`
(LISR 106), `isr-retenciones` (LISR 96), `iva` (LIVA 5-D) or `diot` (LIVA 32 VIII).
`period` is the `YYYY-MM` the payment or information refers to.

Dates are `YYYY-MM-DD` strings. A `Date` is accepted and read by its **local** calendar
components. There is no time-zone arithmetic anywhere.

### Published vs. projected

`getNonBusinessDays` and `DueDate` expose `projected`. RMF data is included through 2026.
For later years the library applies the fixed statutory rules and marks results
`projected: true`: the RMF for that year may still add non-working days or vacation
periods. The library never invents vacations that the SAT has not published.

## What it does *not* do

- Decide whether you are obliged to file, or under which regime (RESICO, bimonthly, etc.).
- Model extra days by the sixth digit of the RFC: I could not confirm that rule in a
  primary source (see [`SOURCES.md`](SOURCES.md)), so it is excluded.
- State, municipal, IMSS or bank calendars, or contingency extensions the SAT publishes ad hoc.

## Development

```sh
npm install
npm run typecheck
npm test
```

## License

MIT © Marco Orta
