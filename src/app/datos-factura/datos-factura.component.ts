import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { ErrorDialogComponent } from '../shared/error-dialog.component';
import { DatosFacturaStore } from '../facturacion/datos-factura.store';
import { DatosFacturaResponse, FacturacionService } from '../facturacion/facturacion.service';

@Component({
  selector: 'app-datos-factura',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, LoadingOverlayComponent, ErrorDialogComponent],
  templateUrl: './datos-factura.component.html',
  styleUrls: ['./datos-factura.component.css'],
})
export class DatosFacturaComponent implements OnInit {
  @ViewChild('formDatos') formDatos?: ElementRef<HTMLFormElement>;

  rfc = '';
  razonSocial = '';
  calle = '';
  numExterior = '';
  numInterior = '';
  referencia = '';
  estado = '';
  municipio = '';
  colonia = '';
  codigoPostal = '';
  correo = '';
  regimen = '';
  uso = '';
  subtotal: number | null = null;
  impuestos: number | null = null;
  total: number | null = null;
  cargando = false;
  errorAbierto = false;
  errorMensaje = '';
  private datosBase: DatosFacturaResponse | null = null;

  regimenOpciones = [
    { value: 'fisica', label: 'Persona Física' },
    { value: 'moral', label: 'Persona Moral' },
  ];

  usoOpciones = [
    { value: 'gastos', label: 'Gastos en general' },
    { value: 'mercancias', label: 'Adquisición de mercancías' },
  ];

  constructor(private router: Router, private store: DatosFacturaStore, private facturacion: FacturacionService) {}

  formatoMoneda(valor: number | null): string {
    if (valor === null || valor === undefined) return '';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  formatoImpuestos(valor: number | null): string {
    if (valor === null || valor === undefined || valor === 0) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  ngOnInit(): void {
    const state = history.state as { datos?: DatosFacturaResponse; rfcCapturado?: string } | undefined;
    const datos = this.store.obtener() ?? state?.datos ?? null;
    const rfcCapturado = this.store.obtenerRfcCapturado() || state?.rfcCapturado || '';
    if (datos) {
      this.datosBase = datos;
      this.store.guardar(datos, rfcCapturado);
      this.subtotal = datos.subtotal ?? null;
      this.impuestos = datos.impuestos ?? null;
      this.total = datos.total ?? null;
    }
    const c = datos?.cliente;
    if (c && (c.rfc || c.razonSocial)) {
      this.rfc = c.rfc ?? '';
      this.razonSocial = c.razonSocial ?? '';
      this.calle = c.calle ?? '';
      this.numExterior = c.numExterior ?? '';
      this.numInterior = c.numInterior ?? '';
      this.referencia = c.referencia ?? '';
      this.estado = c.estado ?? '';
      this.municipio = c.municipio ?? '';
      this.colonia = c.colonia ?? '';
      this.codigoPostal = c.codigoPostal ?? '';
      this.correo = c.correoElectronico ?? '';
      this.regimen = c.regimenFiscal ?? '';
      this.uso = c.usoFactura ?? '';
      if (this.regimen && !this.regimenOpciones.some((o) => o.value === this.regimen)) {
        this.regimenOpciones = [...this.regimenOpciones, { value: this.regimen, label: this.regimen }];
      }
      if (this.uso && !this.usoOpciones.some((o) => o.value === this.uso)) {
        this.usoOpciones = [...this.usoOpciones, { value: this.uso, label: this.uso }];
      }
    } else {
      this.rfc = rfcCapturado;
    }
  }

  cancelar(): void {
    this.formDatos?.nativeElement.reset();
    void this.router.navigate(['/facturar']);
  }

  aceptar(): void {
    const form = this.formDatos?.nativeElement;
    if (form && !form.reportValidity()) {
      return;
    }
    const state = history.state as { datos?: DatosFacturaResponse } | undefined;
    const base = this.datosBase ?? this.store.obtener() ?? state?.datos ?? null;
    if (!base?.numeroTicket) {
      this.mostrarError('No se encontró el ticket a facturar. Regrese y capture de nuevo.');
      return;
    }
    this.cargando = true;
    this.facturacion.facturar(this.construirPayload(base)).subscribe({
      next: (facturada) => {
        this.cargando = false;
        this.store.guardar(facturada, this.rfc.trim());
        const correo = this.correo.trim();
        const mensajeExito = `Factura generada con éxito para el ticket ${facturada.numeroTicket ?? base.numeroTicket ?? ''}`.trim();
        void this.router.navigate(['/factura'], { state: { datos: facturada, correo, mensajeExito, origen: 'facturacion' } });
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        this.mostrarError(this.mensajeError(e));
      },
    });
  }

  cerrarError(): void {
    this.errorAbierto = false;
  }

  private construirPayload(base: DatosFacturaResponse): DatosFacturaResponse {
    return {
      numeroTicket: base.numeroTicket,
      total: base.total ?? this.total,
      subtotal: base.subtotal ?? this.subtotal,
      impuestos: base.impuestos ?? this.impuestos,
      tipoVenta: base.tipoVenta,
      fechaEmision: base.fechaEmision,
      fechaCierre: base.fechaCierre,
      clienteTicket: base.clienteTicket,
      facturable: base.facturable ?? true,
      items: base.items ?? [],
      pagos: base.pagos ?? [],
      tipoPago: base.tipoPago,
      cliente: {
        idCliente: base.cliente?.idCliente ?? null,
        rfc: this.rfc.trim(),
        razonSocial: this.razonSocial.trim(),
        calle: this.calle.trim() || null,
        numExterior: this.numExterior.trim() || null,
        numInterior: this.numInterior.trim() || null,
        referencia: this.referencia.trim() || null,
        estado: this.estado.trim() || null,
        municipio: this.municipio.trim() || null,
        colonia: this.colonia.trim() || null,
        codigoPostal: this.codigoPostal.trim() || null,
        correoElectronico: this.correo.trim() || null,
        regimenFiscal: this.regimen || null,
        usoFactura: this.uso || null,
        estatus: base.cliente?.estatus ?? true,
      },
    };
  }

  private mostrarError(mensaje: string): void {
    this.errorMensaje = mensaje;
    this.errorAbierto = true;
  }

  private mensajeError(e: HttpErrorResponse): string {
    const detail = (e?.error as { detail?: string; message?: string })?.detail
      ?? (e?.error as { message?: string })?.message;
    if (detail) return detail;
    if (e.status === 0) return 'No se pudo conectar con el servidor. Verifique su conexión.';
    if (e.status === 400) return 'Verifique los datos capturados antes de facturar.';
    if (e.status === 401) return 'No autorizado. Inicie sesión para continuar.';
    if (e.status === 403) return 'No tiene permisos para facturar.';
    return 'No se pudo generar la factura. Intente de nuevo.';
  }

  enviar(): void {
    return;
  }
}
