export interface RegimenFiscal {
  value: string;
  label: string;
  fisica: boolean;
  moral: boolean;
}

export const REGIMENES_FISCALES: RegimenFiscal[] = [
  { value: '601', label: '601 General de Ley Personas Morales', fisica: false, moral: true },
  { value: '603', label: '603 Personas Morales con Fines no Lucrativos', fisica: false, moral: true },
  { value: '605', label: '605 Sueldos y Salarios e Ingresos Asimilados a Salarios', fisica: true, moral: false },
  { value: '606', label: '606 Arrendamiento', fisica: true, moral: false },
  { value: '607', label: '607 Régimen de Enajenación o Adquisición de Bienes', fisica: true, moral: false },
  { value: '608', label: '608 Demás ingresos', fisica: true, moral: false },
  { value: '610', label: '610 Residentes en el Extranjero sin Establecimiento Permanente en México', fisica: true, moral: true },
  { value: '611', label: '611 Ingresos por Dividendos (socios y accionistas)', fisica: true, moral: true },
  { value: '612', label: '612 Personas Físicas con Actividades Empresariales y Profesionales', fisica: true, moral: false },
  { value: '614', label: '614 Ingresos por intereses', fisica: true, moral: false },
  { value: '615', label: '615 Régimen de los ingresos por obtención de premios', fisica: true, moral: false },
  { value: '616', label: '616 Sin obligaciones fiscales', fisica: true, moral: false },
  { value: '620', label: '620 Sociedades Cooperativas de Producción que optan por diferir sus ingresos', fisica: false, moral: true },
  { value: '621', label: '621 Incorporación Fiscal', fisica: true, moral: false },
  { value: '622', label: '622 Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', fisica: true, moral: true },
  { value: '623', label: '623 Opcional para Grupos de Sociedades', fisica: false, moral: true },
  { value: '624', label: '624 Coordinados', fisica: false, moral: true },
  { value: '625', label: '625 Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', fisica: true, moral: false },
  { value: '626', label: '626 Régimen Simplificado de Confianza', fisica: true, moral: true },
];

/** Acepta "601", "601 General de Ley..." o valores legacy ('moral'/'fisica' se descartan). */
export function normalizarRegimenFiscal(valor: string | null | undefined): string {
  const v = (valor ?? '').trim();
  if (!v) return '';
  const codigo = v.split(' ')[0].toUpperCase();
  if (REGIMENES_FISCALES.some((r) => r.value === codigo)) return codigo;
  return '';
}

export function filtrarRegimenesFiscales(tipoPersona: string): RegimenFiscal[] {
  const r = (tipoPersona || '').trim().toLowerCase();
  if (r === 'moral') return REGIMENES_FISCALES.filter((x) => x.moral);
  if (r === 'fisica') return REGIMENES_FISCALES.filter((x) => x.fisica);
  return [...REGIMENES_FISCALES];
}

export function regimenFiscalLabel(valor: string | null | undefined): string {
  const codigo = normalizarRegimenFiscal(valor);
  return REGIMENES_FISCALES.find((r) => r.value === codigo)?.label ?? (valor ?? '');
}
