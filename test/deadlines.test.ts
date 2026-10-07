import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { annualDueDate, fiscalCalendar, monthlyDueDate } from '../src/index.js';

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function dow(iso: string): string {
  return DAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()] as string;
}

describe('vencimiento mensual del día 17', () => {
  it('día 17 hábil: no se recorre', () => {
    const r = monthlyDueDate({ obligation: 'iva', period: '2026-02' });
    assert.equal(r.nominal, '2026-03-17');
    assert.equal(dow('2026-03-17'), 'martes');
    assert.equal(r.due, '2026-03-17');
    assert.equal(r.shifted, false);
    assert.deepEqual(r.shiftReasons, []);
  });

  it('el 17 cae en día inhábil (tercer lunes de noviembre) y se recorre al martes 18', () => {
    const r = monthlyDueDate({ obligation: 'isr-retenciones', period: '2025-10' });
    assert.equal(r.nominal, '2025-11-17');
    assert.equal(dow(r.nominal), 'lunes');
    assert.equal(r.due, '2025-11-18');
    assert.equal(dow(r.due), 'martes');
    assert.equal(r.shifted, true);
    assert.match(r.shiftReasons.join(' '), /Día de la Revolución/);
  });

  it('el 17 cae en el tercer lunes de marzo de 2025 y se recorre al 18', () => {
    const r = monthlyDueDate({ obligation: 'diot', period: '2025-02' });
    assert.equal(r.nominal, '2025-03-17');
    assert.equal(dow(r.nominal), 'lunes');
    assert.equal(r.due, '2025-03-18');
  });

  it('el 17 cae en sábado (enero de 2026, periodo de diciembre) y pasa al lunes 19', () => {
    const r = monthlyDueDate({ obligation: 'iva', period: '2025-12' });
    assert.equal(r.nominal, '2026-01-17');
    assert.equal(dow(r.nominal), 'sábado');
    assert.equal(r.due, '2026-01-19');
    assert.equal(dow(r.due), 'lunes');
  });

  it('el 17 cae en día inhábil de la RMF (17 de abril de 2025) y pasa al lunes 21', () => {
    const r = monthlyDueDate({ obligation: 'isr-pagos-provisionales-pm', period: '2025-03' });
    assert.equal(r.nominal, '2025-04-17');
    assert.equal(dow(r.nominal), 'jueves');
    assert.equal(r.due, '2025-04-21');
    assert.equal(dow(r.due), 'lunes');
    assert.match(r.shiftReasons.join(' '), /regla 2\.1\.6/);
  });

  it('el 17 de diciembre de 2025, un día antes de las vacaciones del SAT, no se mueve', () => {
    const r = monthlyDueDate({ obligation: 'iva', period: '2025-11' });
    assert.equal(r.nominal, '2025-12-17');
    assert.equal(dow(r.nominal), 'miércoles');
    assert.equal(r.due, '2025-12-17');
  });

  it('el periodo de diciembre vence en enero del año siguiente', () => {
    assert.equal(monthlyDueDate({ obligation: 'diot', period: '2026-12' }).nominal, '2027-01-17');
  });

  it('el pago provisional de diciembre no existe', () => {
    assert.throws(
      () => monthlyDueDate({ obligation: 'isr-pagos-provisionales-pf', period: '2025-12' }),
      /diciembre/,
    );
  });

  it('rechaza periodos y obligaciones inválidos', () => {
    assert.throws(() => monthlyDueDate({ obligation: 'iva', period: '2025-13' }), RangeError);
    assert.throws(() => monthlyDueDate({ obligation: 'iva', period: '2025-1' }), RangeError);
    // @ts-expect-error obligación inexistente a propósito
    assert.throws(() => monthlyDueDate({ obligation: 'nada', period: '2025-01' }), RangeError);
  });

  it('cita fundamento y fuente primaria', () => {
    const r = monthlyDueDate({ obligation: 'diot', period: '2026-02' });
    assert.ok(r.fundamento.includes('LIVA art. 32, fr. VIII'));
    assert.ok(r.sources.some((s) => s.url === 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf'));
  });

  it('marca como proyectado un vencimiento de un año sin RMF', () => {
    assert.equal(monthlyDueDate({ obligation: 'iva', period: '2026-02' }).projected, false);
    assert.equal(monthlyDueDate({ obligation: 'iva', period: '2027-02' }).projected, true);
  });
});

describe('prórroga del viernes para pago en banco (CFF 12, párr. 5)', () => {
  it('no se aplica por omisión', () => {
    // 17 de abril de 2026: viernes.
    assert.equal(dow('2026-04-17'), 'viernes');
    assert.equal(monthlyDueDate({ obligation: 'iva', period: '2026-03' }).due, '2026-04-17');
  });

  it('con payAtBank, un último día en viernes pasa al lunes', () => {
    const r = monthlyDueDate({ obligation: 'iva', period: '2026-03' }, { payAtBank: true });
    assert.equal(r.due, '2026-04-20');
    assert.equal(dow(r.due), 'lunes');
    assert.equal(r.bankFridayExtension, true);
    assert.equal(r.shifted, true);
  });

  it('con payAtBank, un día que no es viernes no cambia', () => {
    const r = monthlyDueDate({ obligation: 'iva', period: '2026-02' }, { payAtBank: true });
    assert.equal(r.due, '2026-03-17');
    assert.equal(r.bankFridayExtension, false);
  });
});

describe('declaración anual', () => {
  it('personas morales: 31 de marzo', () => {
    const r = annualDueDate({ year: 2025, taxpayer: 'pm' });
    assert.equal(r.nominal, '2026-03-31');
    assert.equal(dow(r.due), 'martes');
    assert.equal(r.due, '2026-03-31');
  });

  it('personas físicas: 30 de abril', () => {
    const r = annualDueDate({ year: 2025, taxpayer: 'pf' });
    assert.equal(r.nominal, '2026-04-30');
    assert.equal(dow(r.due), 'jueves');
    assert.equal(r.due, '2026-04-30');
  });

  it('PF del ejercicio 2026: viernes 30 de abril de 2027 y, pagando en banco, lunes 3 de mayo', () => {
    const plain = annualDueDate({ year: 2026, taxpayer: 'pf' });
    assert.equal(plain.due, '2027-04-30');
    assert.equal(dow(plain.due), 'viernes');
    assert.equal(plain.projected, true);

    const bank = annualDueDate({ year: 2026, taxpayer: 'pf' }, { payAtBank: true });
    // 1 de mayo (sábado) y 2 (domingo) no son hábiles: el siguiente día hábil es el lunes 3.
    assert.equal(dow('2027-05-01'), 'sábado');
    assert.equal(bank.due, '2027-05-03');
    assert.equal(dow(bank.due), 'lunes');
  });

  it('PM del ejercicio 2024: el 31 de marzo de 2025 es lunes', () => {
    const r = annualDueDate({ year: 2024, taxpayer: 'pm' });
    assert.equal(dow(r.nominal), 'lunes');
    assert.equal(r.due, '2025-03-31');
  });

  it('rechaza un tipo de contribuyente inválido', () => {
    // @ts-expect-error valor inexistente a propósito
    assert.throws(() => annualDueDate({ year: 2025, taxpayer: 'x' }), RangeError);
  });
});

describe('fiscalCalendar', () => {
  it('2026 trae 60 vencimientos, ordenados, todos en día hábil de presentación', () => {
    const cal = fiscalCalendar(2026);
    // retenciones + IVA + DIOT: 12 c/u; provisionales PM y PF: 11 c/u; 2 anuales.
    assert.equal(cal.length, 3 * 12 + 2 * 11 + 2);
    const sorted = [...cal].sort((a, b) => a.due.localeCompare(b.due));
    assert.deepEqual(
      cal.map((c) => c.due),
      sorted.map((c) => c.due),
    );
    for (const c of cal) {
      assert.ok(!['sábado', 'domingo'].includes(dow(c.due)), `${c.obligation} ${c.due}`);
      assert.ok(c.due.startsWith('2026-'), `${c.obligation} ${c.due}`);
    }
  });

  it('se puede limitar a algunas obligaciones', () => {
    const cal = fiscalCalendar(2026, { obligations: ['diot'] });
    assert.equal(cal.filter((c) => c.obligation === 'diot').length, 12);
    assert.equal(cal.length, 14);
  });
});
