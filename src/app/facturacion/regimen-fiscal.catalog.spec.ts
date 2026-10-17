import { filtrarRegimenesFiscales, normalizarRegimenFiscal } from './regimen-fiscal.catalog';

describe('regimen-fiscal.catalog', () => {
  describe('filtrarRegimenesFiscales', () => {
    it('moral no incluye regímenes solo de persona física', () => {
      const valores = filtrarRegimenesFiscales('moral').map((r) => r.value);
      expect(valores).toContain('601');
      expect(valores).toContain('603');
      expect(valores).not.toContain('605');
      expect(valores).not.toContain('611');
    });

    it('física incluye 611 y no 601', () => {
      const valores = filtrarRegimenesFiscales('fisica').map((r) => r.value);
      expect(valores).toContain('611');
      expect(valores).toContain('612');
      expect(valores).not.toContain('601');
    });

    it('611 es exclusivo de persona física', () => {
      const fisica = filtrarRegimenesFiscales('fisica').map((r) => r.value);
      const moral = filtrarRegimenesFiscales('moral').map((r) => r.value);
      expect(fisica).toContain('611');
      expect(moral).not.toContain('611');
    });
  });

  describe('normalizarRegimenFiscal', () => {
    it('extrae el código de la descripción y descarta valores legacy', () => {
      expect(normalizarRegimenFiscal('601 General de Ley Personas Morales')).toBe('601');
      expect(normalizarRegimenFiscal('601')).toBe('601');
      expect(normalizarRegimenFiscal('moral')).toBe('');
      expect(normalizarRegimenFiscal('')).toBe('');
    });
  });
});
