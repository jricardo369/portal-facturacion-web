import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { DatosFacturaStore } from '../facturacion/datos-factura.store';
import { DatosFacturaResponse, FacturacionService } from '../facturacion/facturacion.service';

@Component({
    selector: 'app-factura',
    imports: [FormsModule, HeaderComponent, FooterComponent],
    templateUrl: './factura.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./factura.component.css']
})
export class FacturaComponent implements OnInit {
  correo = '';
  mensajeExito = '';
  mensajeInfo = '';
  errorInfo = false;
  esConsulta = false;
  correoEnviado = '';
  intento = false;
  datos: DatosFacturaResponse | null = null;

  private uuid = '';
  private descargando = false;

  constructor(private router: Router, private store: DatosFacturaStore, private facturacion: FacturacionService) {}

  ngOnInit(): void {
    const state = history.state as { datos?: DatosFacturaResponse; correo?: string; mensajeExito?: string; origen?: string } | undefined;
    const datos = state?.datos ?? this.store.obtener() ?? null;
    this.datos = datos;
    this.correo = state?.correo?.trim() || datos?.cliente?.correoElectronico?.trim() || '';
    this.esConsulta = state?.origen === 'consulta';
    const ticket = datos?.numeroTicket?.trim() || '';
    this.mensajeExito = state?.mensajeExito?.trim() || (ticket ? `Factura generada con éxito para el ticket ${ticket}` : 'Factura generada con éxito');
  }

  get hayDatos(): boolean {
    return !!this.datos?.numeroTicket;
  }

  get numeroTicket(): string {
    return this.datos?.numeroTicket?.trim() ?? '';
  }

  get rfc(): string {
    return this.datos?.cliente?.rfc?.trim() ?? '';
  }

  get razonSocial(): string {
    return this.datos?.cliente?.razonSocial?.trim() ?? '';
  }

  get tipoPago(): string {
    return this.datos?.tipoPago?.trim() ?? '';
  }

  get subtotal(): number | null {
    return this.datos?.subtotal ?? null;
  }

  get impuestos(): number | null {
    return this.datos?.impuestos ?? null;
  }

  get total(): number | null {
    const total = this.datos?.total;
    if (total !== null && total !== undefined) return total;
    const subtotal = this.subtotal;
    if (subtotal === null) return null;
    return Math.round((subtotal + (this.impuestos ?? 0)) * 100) / 100;
  }

  get fechaEmision(): string {
    const fecha = this.datos?.fechaEmision;
    if (!fecha) return '';
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return fecha;
    return parsed.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  }

  get textoCorreo(): string {
    return this.esConsulta
      ? 'Ingresa el correo al que deseas enviar la factura nuevamente'
      : 'La factura fue enviada al correo electrónico ingresado';
  }

  get textoBotonEnviar(): string {
    return this.esConsulta ? 'Enviar' : 'Enviar nuevamente';
  }

  get correoInvalido(): boolean {
    return this.intento && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.correo.trim());
  }

  formatoMoneda(valor: number | null): string {
    if (valor === null || valor === undefined) return '—';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  formatoImpuestos(valor: number | null): string {
    if (valor === null || valor === undefined) return '—';
    if (valor === 0) return 'Sin impuestos';
    return this.formatoMoneda(valor);
  }

  enviarNuevamente(): void {
    this.intento = true;
    if (!this.correo.trim() || this.correoInvalido) {
      this.mensajeInfo = 'Capture un correo electrónico válido para reenviar la factura.';
      this.errorInfo = true;
      this.correoEnviado = '';
      return;
    }
    const ticket = this.numeroTicket;
    this.facturacion.enviarCorreo(this.correo.trim(), ticket).subscribe({
      next: () => {
        this.correoEnviado = this.correo.trim();
        this.mensajeInfo = 'Factura reenviada';
        this.errorInfo = false;
        this.intento = false;
      },
      error: () => {
        this.mensajeInfo = 'Error al enviar la factura. Intenta de nuevo.';
        this.errorInfo = true;
        this.correoEnviado = '';
      }
    });
  }

  descargarXml(): void {
    this.descargarComprobante('xml');
  }

  descargarPdf(): void {
    this.descargarComprobante('pdf');
  }

  private descargarComprobante(tipo: 'xml' | 'pdf'): void {
    if (this.descargando) return;
    if (this.uuid) {
      this.solicitarDescarga(this.uuid, tipo);
      return;
    }
    const ticket = this.numeroTicket;
    if (!ticket) return;
    this.descargando = true;
    this.facturacion.obtenerFacturaPorTicket(ticket).subscribe({
      next: (factura) => {
        const uuid = factura?.uuid?.trim() ?? '';
        if (!uuid) {
          this.descargando = false;
          return;
        }
        this.uuid = uuid;
        this.solicitarDescarga(uuid, tipo);
      },
      error: () => {
        this.descargando = false;
      },
    });
  }

  private solicitarDescarga(uuid: string, tipo: 'xml' | 'pdf'): void {
    this.descargando = true;
    const peticion = tipo === 'pdf'
      ? this.facturacion.descargarPdf(uuid)
      : this.facturacion.descargarXml(uuid);
    peticion.subscribe({
      next: (blob) => {
        this.descargando = false;
        this.guardarArchivo(blob, uuid, tipo);
      },
      error: () => {
        this.descargando = false;
      },
    });
  }

  private guardarArchivo(blob: Blob, uuid: string, tipo: 'xml' | 'pdf'): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cfdi-${this.numeroTicket || uuid}.${tipo}`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  nuevaFactura(): void {
    this.store.limpiar();
    void this.router.navigate(['/']);
  }

  irAFacturar(): void {
    this.store.limpiar();
    void this.router.navigate(['/facturar']);
  }
}
