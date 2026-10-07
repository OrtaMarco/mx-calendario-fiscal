import type { Source } from '../types.js';

/**
 * Fuentes primarias. Todas las URL se descargaron y leyeron al construir el paquete
 * (2026-10-06); ver SOURCES.md para el texto citado y lo que quedó sin verificar.
 */
export const SOURCES = {
  cff: {
    label: 'Código Fiscal de la Federación (última reforma DOF 09-04-2026)',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf',
  },
  lft: {
    label: 'Ley Federal del Trabajo (última reforma DOF 14-05-2026)',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf',
  },
  lisr: {
    label: 'Ley del Impuesto sobre la Renta',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf',
  },
  liva: {
    label: 'Ley del Impuesto al Valor Agregado',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf',
  },
  rmf2025: {
    label: 'Resolución Miscelánea Fiscal para 2025, regla 2.1.6 (compilada a la 1.ª modificación, SAT)',
    url: 'http://omawww.sat.gob.mx/normatividad_RMF_RGCE/Paginas/documentos2025/rmf/compiladas/Compilado_Primera_Modificacion_a_la-Resolucion_Miscelanea_Fiscal_para_2025-22012025.pdf',
  },
  rmf2025Mod4: {
    label: 'Cuarta Resolución de Modificaciones a la RMF 2025 (DOF 09-07-2025), regla 2.1.6',
    url: 'https://dof.gob.mx/nota_detalle.php?codigo=5762426&fecha=09%2F07%2F2025',
  },
  rmf2026: {
    label: 'Resolución Miscelánea Fiscal para 2026 (DOF 28-12-2025), regla 2.1.6',
    url: 'https://dof.gob.mx/2025/SHCP/SHCP_281225_01.pdf',
  },
  rmf2026Mod1: {
    label: 'Primera Resolución de Modificaciones a la RMF 2026 (DOF 09-07-2026), regla 2.1.6',
    url: 'https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/1aRM_RMF2026.pdf',
  },
} as const satisfies Record<string, Source>;

/**
 * Último año para el que existe RMF publicada en las fuentes incorporadas. Los años
 * posteriores se calculan por regla de ley y se marcan como `projected`.
 */
export const LAST_PUBLISHED_RMF_YEAR = 2026;
