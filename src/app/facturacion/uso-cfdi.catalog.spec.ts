import { filtrarUsosCfdi, normalizarUsoCfdi } from './uso-cfdi.catalog';

describe('uso-cfdi.catalog', () => {
  describe('filtrarUsosCfdi', () => {
    it('devuelve lista vacía cuando no hay régimen seleccionado', () => {
      expect(filtrarUsosCfdi('')).toEqual([]);
    });

    it('régimen 601 (moral) no permite usos D ni CN01', () => {
      const valores = filtrarUsosCfdi('601').map((u) => u.value);
      expect(valores).toContain('G03');
      expect(valores).toContain('I01');
      expect(valores).toContain('S01');
      expect(valores).toContain('CP01');
      expect(valores).not.toContain('D01');
      expect(valores).not.toContain('CN01');
    });

    it('régimen 605 (sueldos) solo permite D, S01, CP01 y CN01', () => {
      const valores = filtrarUsosCfdi('605').map((u) => u.value);
      expect(valores).toContain('D01');
      expect(valores).toContain('D10');
      expect(valores).toContain('CN01');
      expect(valores).toContain('S01');
      expect(valores).not.toContain('G03');
    });

    it('régimen 616 solo permite S01 y CP01', () => {
      const valores = filtrarUsosCfdi('616').map((u) => u.value);
      expect(valores).toEqual(['S01', 'CP01']);
    });

    it('régimen 612 permite G, I y D', () => {
      const valores = filtrarUsosCfdi('612').map((u) => u.value);
      expect(valores).toContain('G03');
      expect(valores).toContain('I04');
      expect(valores).toContain('D01');
    });

    it('acepta minúsculas y espacios', () => {
      expect(filtrarUsosCfdi(' 601 ').map((u) => u.value)).toContain('G03');
    });
  });

  describe('normalizarUsoCfdi', () => {
    it('normaliza descripciones y valores legacy', () => {
      expect(normalizarUsoCfdi('G03 Gastos en general')).toBe('G03');
      expect(normalizarUsoCfdi('gastos')).toBe('G03');
      expect(normalizarUsoCfdi('mercancias')).toBe('G01');
      expect(normalizarUsoCfdi('')).toBe('');
    });
  });
});
