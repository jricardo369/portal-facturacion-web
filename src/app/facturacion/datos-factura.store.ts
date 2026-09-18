import { Injectable } from '@angular/core';
import { DatosFacturaResponse } from './facturacion.service';

@Injectable({ providedIn: 'root' })
export class DatosFacturaStore {
  private datos: DatosFacturaResponse | null = null;
  private rfcCapturado = '';

  guardar(datos: DatosFacturaResponse, rfcCapturado = ''): void {
    this.datos = datos;
    this.rfcCapturado = rfcCapturado;
    try {
      sessionStorage.setItem('datos_factura', JSON.stringify(datos));
      sessionStorage.setItem('rfc_capturado', rfcCapturado);
    } catch {
      return;
    }
  }

  obtener(): DatosFacturaResponse | null {
    if (this.datos) return this.datos;
    try {
      const raw = sessionStorage.getItem('datos_factura');
      if (raw) {
        this.datos = JSON.parse(raw) as DatosFacturaResponse;
        this.rfcCapturado = sessionStorage.getItem('rfc_capturado') ?? this.rfcCapturado;
        return this.datos;
      }
    } catch {
      return this.datos;
    }
    return this.datos;
  }

  obtenerRfcCapturado(): string {
    if (this.rfcCapturado) return this.rfcCapturado;
    try {
      return sessionStorage.getItem('rfc_capturado') ?? '';
    } catch {
      return this.rfcCapturado;
    }
  }

  limpiar(): void {
    this.datos = null;
    this.rfcCapturado = '';
    try {
      sessionStorage.removeItem('datos_factura');
      sessionStorage.removeItem('rfc_capturado');
    } catch {
      return;
    }
  }
}
