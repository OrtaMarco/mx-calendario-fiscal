# mx-calendario-fiscal

Fechas fiscales y días hábiles de México en TypeScript, **sin dependencias**. Cada regla y
cada fecha lleva su fundamento legal y un enlace a la fuente primaria.

> **Aviso legal.** Es una herramienta de apoyo, **no asesoría fiscal ni legal**. Las fechas
> dependen de leyes y resoluciones que el SAT puede cambiar en cualquier momento. Verifica
> contra las fuentes primarias ([`SOURCES.md`](SOURCES.md)) o con un profesional antes de
> confiar en una fecha.

[English README](README.md) · [Fuentes](SOURCES.md) · [Diseño](DESIGN.md)

## Por qué

Un vencimiento fiscal no es "el día 17": es el 17 recorrido al siguiente día hábil, y "día
hábil" lo definen tres documentos distintos que no coinciden:

- **CFF art. 12**: días que nunca cuentan (fines de semana, lunes recorridos, 5 de mayo…).
- **RMF regla 2.1.6**: días y periodos generales de vacaciones que el SAT declara inhábiles.
  **No** detienen el plazo para presentar declaraciones y pagar (CFF 12, párr. 2).
- **LFT art. 74**: descansos obligatorios laborales. No es la misma lista: el 5 de mayo es
  inhábil fiscal pero no laboral, y el relevo presidencial es 1 de diciembre en el CFF y
  1 de octubre en la LFT.

La librería mantiene esos conjuntos separados y te dice *por qué* un día es inhábil.

## Instalación

```sh
npm install mx-calendario-fiscal
```

Node ≥ 18, ESM y CommonJS, con tipos. Aún no publicado en npm.

## Uso

```ts
import { isBusinessDay, nextBusinessDay, addBusinessDays, monthlyDueDate, annualDueDate } from 'mx-calendario-fiscal';

isBusinessDay('2025-11-17'); // false: tercer lunes de noviembre
nextBusinessDay('2025-11-17'); // '2025-11-18'

// IVA de octubre de 2025: el 17 es inhábil y se recorre al 18.
const iva = monthlyDueDate({ obligation: 'iva', period: '2025-10' });
iva.nominal; // '2025-11-17'
iva.due; // '2025-11-18'

// Declaración anual de personas físicas, ejercicio 2025.
annualDueDate({ year: 2025, taxpayer: 'pf' }).due; // '2026-04-30'

// Plazo de trámite en días hábiles: las vacaciones del SAT (18–31 jul 2025) no cuentan.
addBusinessDays('2025-07-17', 1); // '2025-08-01'
// Para declarar y pagar sí son hábiles.
addBusinessDays('2025-07-17', 1, { purpose: 'filing' }); // '2025-07-18'
```

Con `payAtBank: true`, si el último día del plazo es viernes y se paga en banco, se prorroga
al siguiente día hábil (CFF art. 12, párr. 5).

La tabla de funciones y las reglas de fechas proyectadas están en el
[README en inglés](README.md#api).

## Lo que no hace

- Decidir si estás obligado a presentar ni bajo qué régimen.
- Días adicionales por sexto dígito del RFC: no pude confirmarlo en fuente primaria, por
  eso está excluido (ver [`SOURCES.md`](SOURCES.md)).
- Calendarios estatales, del IMSS o bancarios, ni prórrogas por contingencia.

## Licencia

MIT © Marco Orta
