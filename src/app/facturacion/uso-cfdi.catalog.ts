export interface UsoCfdi {
  value: string;
  label: string;
  fisica: boolean;
  moral: boolean;
}

export const USOS_CFDI: UsoCfdi[] = [
  { value: 'G01', label: 'G01 Adquisición de mercancías', fisica: true, moral: true },
  { value: 'G02', label: 'G02 Devoluciones, descuentos o bonificaciones', fisica: true, moral: true },
  { value: 'G03', label: 'G03 Gastos en general', fisica: true, moral: true },
  { value: 'I01', label: 'I01 Construcciones', fisica: true, moral: true },
  { value: 'I02', label: 'I02 Mobiliario y equipo de oficina por inversiones', fisica: true, moral: true },
  { value: 'I03', label: 'I03 Equipo de transporte', fisica: true, moral: true },
  { value: 'I04', label: 'I04 Equipo de cómputo y accesorios', fisica: true, moral: true },
  { value: 'I05', label: 'I05 Dados, troqueles, moldes, matrices y herramental', fisica: true, moral: true },
  { value: 'I06', label: 'I06 Comunicaciones telefónicas', fisica: true, moral: true },
  { value: 'I07', label: 'I07 Comunicaciones satelitales', fisica: true, moral: true },
  { value: 'I08', label: 'I08 Otra maquinaria y equipo', fisica: true, moral: true },
  { value: 'D01', label: 'D01 Honorarios médicos, dentales y gastos hospitalarios', fisica: true, moral: false },
  { value: 'D02', label: 'D02 Gastos médicos por incapacidad o discapacidad', fisica: true, moral: false },
  { value: 'D03', label: 'D03 Gastos funerales', fisica: true, moral: false },
  { value: 'D04', label: 'D04 Donativos', fisica: true, moral: false },
  { value: 'D05', label: 'D05 Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)', fisica: true, moral: false },
  { value: 'D06', label: 'D06 Aportaciones voluntarias al SAR', fisica: true, moral: false },
  { value: 'D07', label: 'D07 Primas por seguros de gastos médicos', fisica: true, moral: false },
  { value: 'D08', label: 'D08 Gastos de transportación escolar obligatoria', fisica: true, moral: false },
  { value: 'D09', label: 'D09 Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones', fisica: true, moral: false },
  { value: 'D10', label: 'D10 Pagos por servicios educativos (colegiaturas)', fisica: true, moral: false },
  { value: 'S01', label: 'S01 Sin efectos fiscales', fisica: true, moral: true },
  { value: 'CP01', label: 'CP01 Pagos', fisica: true, moral: true },
  { value: 'CN01', label: 'CN01 Nómina', fisica: true, moral: false },
];

/** Compatibilidad con valores legacy guardados ('gastos', 'mercancias'). */
const USOS_LEGACY: Record<string, string> = {
  gastos: 'G03',
  mercancias: 'G01',
};

export function normalizarUsoCfdi(valor: string | null | undefined): string {
  const v = (valor ?? '').trim();
  if (!v) return '';
  // "G03 Gastos en general" -> "G03", "gastos" -> "G03", "G03" -> "G03"
  const codigo = v.split(' ')[0].toUpperCase();
  if (USOS_CFDI.some((u) => u.value === codigo)) return codigo;
  const legacy = USOS_LEGACY[v.toLowerCase()];
  if (legacy) return legacy;
  return v;
}

export function filtrarUsosCfdi(regimen: string): UsoCfdi[] {
  const r = (regimen || '').trim().toLowerCase();
  if (r === 'moral') return USOS_CFDI.filter((u) => u.moral);
  if (r === 'fisica') return USOS_CFDI.filter((u) => u.fisica);
  return [...USOS_CFDI];
}

export function usoCfdiLabel(valor: string | null | undefined): string {
  const codigo = normalizarUsoCfdi(valor);
  return USOS_CFDI.find((u) => u.value === codigo)?.label ?? (valor ?? '');
}
