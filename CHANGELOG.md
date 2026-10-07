# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
[Semantic Versioning](https://semver.org/lang/es/).

## [0.1.0] - Sin publicar

### Añadido

- Días inhábiles fiscales: CFF art. 12 (párr. 1), regla 2.1.6 de la RMF 2025 y 2026 y
  periodos generales de vacaciones del SAT publicados.
- Días de descanso obligatorio de la LFT art. 74 (fr. I–VIII), separados de los fiscales.
- `isBusinessDay`, `nextBusinessDay`, `previousBusinessDay`, `addBusinessDays` y
  `whyNotBusinessDay`, con `purpose: 'procedure' | 'filing'`.
- Vencimientos: día 17 (pagos provisionales ISR, retenciones ISR, IVA, DIOT) y declaración
  anual PM/PF, con recorrido al siguiente día hábil y prórroga opcional del viernes
  bancario.
- `fiscalCalendar(year)` y marca `projected` para años sin RMF publicada.
- Builds ESM y CommonJS, tipos incluidos, sin dependencias.
