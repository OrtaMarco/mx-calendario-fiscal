import { writeFileSync } from 'node:fs';

// dist/cjs hereda "type": "module" del paquete; este marcador lo declara CommonJS.
writeFileSync(new URL('../dist/cjs/package.json', import.meta.url), '{"type":"commonjs"}\n');
