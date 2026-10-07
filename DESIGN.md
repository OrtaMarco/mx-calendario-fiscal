# DESIGN — mx-calendario-fiscal

## Problema

Calcular "¿qué día vence esto?" en México exige combinar tres fuentes que viven en
documentos distintos: los días que el CFF art. 12 no cuenta, los días y periodos que la
Resolución Miscelánea Fiscal (regla 2.1.6) declara inhábiles para el SAT, y los
vencimientos mensuales/anuales de las leyes (LISR, LIVA). Además, los días de descanso de la
LFT art. 74 **no coinciden** con los del CFF (p. ej. el 5 de mayo es inhábil fiscal pero no
laboral; el relevo presidencial es 1 de octubre en la LFT y 1 de diciembre en el CFF).

## Usuario

Desarrolladores de software contable, ERPs, recordatorios y bots que necesitan fechas
fiscales correctas, con su fundamento, sin dependencias.

## Alcance v0.1.0

- Días inhábiles fiscales (CFF 12 + RMF 2.1.6) y días de descanso obligatorio (LFT 74),
  2025–2027, cada uno con fundamento y URL de fuente primaria.
- `isBusinessDay`, `nextBusinessDay`, `addBusinessDays` (cómputo de plazos en días hábiles).
- Vencimientos: día 17 (pagos provisionales ISR, retenciones ISR, IVA, DIOT) con
  recorrido al siguiente día hábil; declaración anual PM (marzo) y PF (abril).
- Distinción legal: las vacaciones generales del SAT **sí son hábiles** para presentar
  declaraciones y pagar (CFF 12, párr. 2); no lo son para plazos de trámites.
- Regla opcional de pago en banco en viernes (CFF 12, párr. 5).
- Marca de `projected` en fechas calculadas por regla para años sin RMF publicada.
- Cero dependencias en runtime, ESM + CJS, tipos incluidos, fechas como `YYYY-MM-DD`.

## No objetivos

- No es asesoría fiscal ni calcula impuestos.
- Sin calendarios estatales, IMSS/INFONAVIT, ni regímenes con plazos propios (RESICO
  bimestral, comercio exterior, etc.).
- Sin días adicionales por sexto dígito del RFC: no pude verificarlo en fuente primaria
  (no aparece en la RMF 2026). Queda como `TODO(verificar)` y fuera del comportamiento.
- No se proyectan vacaciones del SAT aún no publicadas.

## API

```ts
isBusinessDay('2025-11-17')                         // false (3.er lunes de nov.)
nextBusinessDay('2025-11-17')                       // '2025-11-18'
addBusinessDays('2025-07-17', 5, { purpose: 'procedure' })
getNonBusinessDays(2026)                            // con fundamento y URL
monthlyDueDate({ period: '2025-10' })               // { due: '2025-11-18', ... }
annualDueDate({ year: 2025, taxpayer: 'pf' })       // { due: '2026-04-30', ... }
fiscalCalendar(2026)                                // todos los vencimientos del año
laborHolidays(2026)                                 // LFT art. 74
```

## Competidores

| Paquete | Qué hace | Diferencia |
|---|---|---|
| `mexico-holidays` (npm) | Días de descanso LFT art. 74 y helper de día hábil | Solo laboral: sin CFF 12, sin RMF, sin vencimientos ni distinción presentación/trámite |
| Calendarios en blogs/PDF | Listas anuales | No son librería, sin fundamento verificable |

Se busca en npm (consulta a la API del registro, 2026-10-06). No encontré librería que
cubra el lado fiscal; la diferencia es CFF + RMF + vencimientos + fundamento por fecha.
