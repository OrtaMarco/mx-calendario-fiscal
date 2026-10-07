import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addBusinessDays,
  getNonBusinessDays,
  isBusinessDay,
  isLaborHoliday,
  laborHolidays,
  nextBusinessDay,
  previousBusinessDay,
  whyNotBusinessDay,
} from '../src/index.js';

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Día de la semana calculado con Date, nunca a mano. */
function dow(iso: string): string {
  return DAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()] as string;
}

describe('fechas de apoyo (verificadas con Date)', () => {
  it('los días de la semana que usan las pruebas son los esperados', () => {
    assert.equal(dow('2025-11-17'), 'lunes');
    assert.equal(dow('2025-03-17'), 'lunes');
    assert.equal(dow('2026-01-17'), 'sábado');
    assert.equal(dow('2025-04-17'), 'jueves');
    assert.equal(dow('2025-04-18'), 'viernes');
  });
});

describe('días inhábiles de CFF art. 12', () => {
  it('el tercer lunes de noviembre de 2025 (17) es inhábil', () => {
    assert.equal(dow('2025-11-17'), 'lunes');
    assert.equal(isBusinessDay('2025-11-17'), false);
    assert.equal(nextBusinessDay('2025-11-17'), '2025-11-18');
  });

  it('calcula los lunes recorridos de 2026', () => {
    const dates = getNonBusinessDays(2026, { purpose: 'filing' })
      .filter((d) => d.kind === 'cff-holiday')
      .map((d) => d.date);
    assert.deepEqual(dates, [
      '2026-01-01',
      '2026-02-02',
      '2026-03-16',
      '2026-05-01',
      '2026-05-05',
      '2026-09-16',
      '2026-11-16',
      '2026-12-25',
    ]);
    for (const date of dates.filter((d) => d.slice(5) !== '01-01' && !/-(05-0[15]|09-16|12-25)$/.test(d))) {
      assert.equal(dow(date), 'lunes', `${date} debe ser lunes`);
    }
  });

  it('el 5 de mayo es inhábil fiscal pero no descanso laboral', () => {
    assert.equal(isBusinessDay('2026-05-05'), false);
    assert.equal(isLaborHoliday('2026-05-05'), false);
    assert.equal(isLaborHoliday('2026-05-01'), true);
  });

  it('el relevo presidencial: 1 de diciembre en el CFF, 1 de octubre en la LFT', () => {
    assert.equal(dow('2030-12-01'), 'domingo');
    assert.equal(dow('2030-10-01'), 'martes');
    const cff = getNonBusinessDays(2030, { purpose: 'filing' }).map((d) => d.date);
    assert.ok(cff.includes('2030-12-01'));
    assert.ok(!cff.includes('2030-10-01'));
    const lft = laborHolidays(2030).map((d) => d.date);
    assert.ok(lft.includes('2030-10-01'));
    assert.ok(!lft.includes('2030-12-01'));
    assert.equal(isBusinessDay('2030-10-01'), true);
    assert.equal(isBusinessDay('2027-10-01'), true);
  });
});

describe('días inhábiles y vacaciones de la RMF (regla 2.1.6)', () => {
  it('17 y 18 de abril de 2025 son inhábiles para el SAT', () => {
    assert.equal(isBusinessDay('2025-04-17'), false);
    assert.equal(isBusinessDay('2025-04-18'), false);
    assert.equal(nextBusinessDay('2025-04-17'), '2025-04-21');
    assert.equal(dow('2025-04-21'), 'lunes');
  });

  it('2 y 3 de abril de 2026 son inhábiles para el SAT', () => {
    assert.equal(dow('2026-04-02'), 'jueves');
    assert.equal(isBusinessDay('2026-04-02'), false);
    assert.equal(isBusinessDay('2026-04-03'), false);
    assert.equal(nextBusinessDay('2026-04-02'), '2026-04-06');
  });

  it('las vacaciones de julio de 2025 no corren plazos de trámites', () => {
    assert.equal(dow('2025-07-17'), 'jueves');
    // Del 18 al 31 de julio no cuenta; el día 1 es el viernes 1 de agosto.
    assert.equal(addBusinessDays('2025-07-17', 1), '2025-08-01');
    assert.equal(dow('2025-08-01'), 'viernes');
    assert.equal(addBusinessDays('2025-07-17', 5), '2025-08-07');
    assert.equal(dow('2025-08-07'), 'jueves');
  });

  it('para declarar y pagar, las vacaciones generales sí son hábiles (CFF 12, párr. 2)', () => {
    assert.equal(dow('2025-07-18'), 'viernes');
    assert.equal(isBusinessDay('2025-07-18', { purpose: 'procedure' }), false);
    assert.equal(isBusinessDay('2025-07-18', { purpose: 'filing' }), true);
    assert.equal(addBusinessDays('2025-07-17', 1, { purpose: 'filing' }), '2025-07-18');
  });

  it('vacaciones de julio de 2026 y de diciembre de 2025 – enero de 2026', () => {
    assert.equal(dow('2026-07-20'), 'lunes');
    assert.equal(isBusinessDay('2026-07-20'), false);
    assert.equal(isBusinessDay('2026-07-31'), false);
    assert.equal(nextBusinessDay('2026-07-20'), '2026-08-03');
    assert.equal(dow('2026-08-03'), 'lunes');
    assert.equal(isBusinessDay('2025-12-18'), false);
    assert.equal(isBusinessDay('2026-01-02'), false);
    assert.equal(nextBusinessDay('2025-12-18'), '2026-01-05');
    assert.equal(dow('2026-01-05'), 'lunes');
  });

  it('explica por qué un día no es hábil, con fundamento y fuente', () => {
    const [reason] = whyNotBusinessDay('2026-07-22');
    assert.ok(reason);
    assert.equal(reason.kind, 'sat-vacation');
    assert.match(reason.fundamento, /regla 2\.1\.6/);
    assert.match(reason.source.url, /^https:\/\/www\.sat\.gob\.mx\//);
    assert.deepEqual(whyNotBusinessDay('2026-07-22', { purpose: 'filing' }), []);
    assert.equal(whyNotBusinessDay('2026-07-25')[0]?.kind, 'weekend');
  });

  it('todo día listado trae fundamento y URL de fuente primaria', () => {
    for (const year of [2025, 2026, 2027]) {
      for (const day of getNonBusinessDays(year)) {
        assert.ok(day.fundamento.length > 0, `${day.date} sin fundamento`);
        assert.match(day.source.url, /^https?:\/\/(www\.|omawww\.)?(dof|sat|diputados)\.gob\.mx\//);
      }
    }
  });
});

describe('proyección por año', () => {
  it('2027 sale de la ley y se marca como proyectado; 2026 no', () => {
    const d2027 = getNonBusinessDays(2027, { purpose: 'filing' });
    assert.ok(d2027.length > 0);
    assert.ok(d2027.every((d) => d.projected));
    assert.ok(getNonBusinessDays(2026).every((d) => !d.projected));
    assert.equal(dow('2027-02-01'), 'lunes');
    assert.ok(d2027.some((d) => d.date === '2027-02-01'));
  });

  it('no inventa vacaciones de 2027 ni de diciembre de 2026', () => {
    assert.equal(isBusinessDay('2026-12-21'), true);
    assert.equal(isBusinessDay('2027-07-20'), true);
  });
});

describe('cómputo en días hábiles', () => {
  it('addBusinessDays no cuenta el día de inicio y salta fines de semana', () => {
    assert.equal(dow('2026-06-04'), 'jueves');
    assert.equal(addBusinessDays('2026-06-04', 1), '2026-06-05');
    assert.equal(addBusinessDays('2026-06-04', 2), '2026-06-08');
    assert.equal(addBusinessDays('2026-06-08', -1), '2026-06-05');
    assert.equal(addBusinessDays('2026-06-06', 0), '2026-06-06');
  });

  it('acepta Date (por componentes locales) y rechaza fechas inválidas', () => {
    assert.equal(isBusinessDay(new Date(2025, 10, 17)), false);
    assert.equal(nextBusinessDay(new Date(2025, 10, 17)), '2025-11-18');
    assert.throws(() => isBusinessDay('2025-02-30'), RangeError);
    assert.throws(() => isBusinessDay('17/11/2025'), RangeError);
    assert.throws(() => isBusinessDay(new Date('nope')), RangeError);
    assert.throws(() => addBusinessDays('2025-01-02', 1.5), RangeError);
  });

  it('previousBusinessDay retrocede al día hábil anterior', () => {
    assert.equal(previousBusinessDay('2025-11-17'), '2025-11-14');
    assert.equal(dow('2025-11-14'), 'viernes');
  });
});
