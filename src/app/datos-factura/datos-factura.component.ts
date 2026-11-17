import { Component, ElementRef, HostListener, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { ErrorDialogComponent } from '../shared/error-dialog.component';
import { DatosFacturaStore } from '../facturacion/datos-factura.store';
import { ClienteDatos, DatosFacturaResponse, FacturacionService } from '../facturacion/facturacion.service';
import { USOS_CFDI, filtrarUsosCfdi, normalizarUsoCfdi, usoCfdiLabel } from '../facturacion/uso-cfdi.catalog';
import { filtrarRegimenesFiscales, normalizarRegimenFiscal, regimenFiscalLabel } from '../facturacion/regimen-fiscal.catalog';

@Component({
    selector: 'app-datos-factura',
    imports: [FormsModule, RouterLink, HeaderComponent, FooterComponent, LoadingOverlayComponent, ErrorDialogComponent],
    templateUrl: './datos-factura.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./datos-factura.component.css']
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
  regimenFiscal = '';
  subtotal: number | null = null;
  impuestos: number | null = null;
  total: number | null = null;
  tipoPago: string | null = null;
  cargando = false;
  errorAbierto = false;
  errorMensaje = '';
  confirmacionAbierta = false;
  intento = false;
  desdeAdmin = false;
  private datosBase: DatosFacturaResponse | null = null;
  tickets: DatosFacturaResponse[] = [];
  ticketParaAgregar = { rfc: '', numeroTicket: '', fecha: '', total: '' };

  @ViewChild('closeConfirm') closeConfirm?: ElementRef<HTMLButtonElement>;

  private usosExtra: { value: string; label: string }[] = [];

  get tipoPersona(): string {
    return this.regimen;
  }

  get fechaTicket(): string {
    const fecha = this.datosBase?.fechaEmision ?? this.datosBase?.fechaCierre;
    if (!fecha) return '';
    const parsed = new Date(fecha);
    if (Number.isNaN(parsed.getTime())) return fecha;
    return parsed.toLocaleDateString('es-MX', { dateStyle: 'medium' });
  }

  private readonly tasaIva = 0.16;
  private readonly tasaIsr = 0.0125;

  private get factorTotal(): number {
    return this.tipoPersona === 'fisica' ? 1.16 : 1.1475;
  }

  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  get subtotalCalculado(): number | null {
    if (this.total === null || this.total === undefined) return null;
    return this.redondear(this.total / this.factorTotal);
  }

  get ivaCalculado(): number | null {
    const subtotal = this.subtotalCalculado;
    if (subtotal === null || !this.tipoPersona) return null;
    return this.redondear(subtotal * this.tasaIva);
  }

  get isrCalculado(): number | null {
    const subtotal = this.subtotalCalculado;
    if (subtotal === null || this.tipoPersona !== 'moral') return null;
    return this.redondear(subtotal * this.tasaIsr);
  }

  get impuestosCalculado(): number | null {
    const iva = this.ivaCalculado;
    if (iva === null) return null;
    return this.redondear(iva - (this.isrCalculado ?? 0));
  }

  get numeroTicket(): string {
    return this.datosBase?.numeroTicket ?? '';
  }

  get ticketsParaFacturar(): DatosFacturaResponse[] {
    const datos = this.datosBase ?? this.store.obtener() ?? null;
    const tickets = this.tickets.length
      ? this.tickets
      : datos?.tickets && datos.tickets.length
        ? datos.tickets
        : datos
          ? [datos]
          : [];
    const activos = (tickets ?? []).filter((t) => t?.numeroTicket);
    this.tickets = activos;
    return activos;
  }

  get subtotalTickets(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (!tickets.length) return null;
    return this.redondear(tickets.reduce((acc, t) => acc + (t?.subtotal ?? 0), 0));
  }

  get totalTickets(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (!tickets.length) return null;
    return this.redondear(tickets.reduce((acc, t) => acc + (t?.total ?? 0), 0));
  }

  get impuestosTickets(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (!tickets.length) return null;
    return this.redondear(tickets.reduce((acc, t) => acc + (t?.impuestos ?? 0), 0));
  }

  get ivaTickets(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (!tickets.length) return null;
    return this.redondear(tickets.reduce((acc, t) => acc + (t?.iva ?? 0), 0));
  }

  get isrTickets(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (!tickets.length) return null;
    return this.redondear(tickets.reduce((acc, t) => acc + (t?.isr ?? 0), 0));
  }

  get totalCombinado(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (!tickets.length) return null;
    return this.redondear(tickets.reduce((acc, t) => acc + (t?.total ?? 0), 0));
  }

  get subtotalFactura(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (tickets.length <= 1) return this.subtotalCalculado;
    const total = this.totalCombinado;
    if (total === null) return null;
    return this.redondear(total / this.factorTotal);
  }

  get ivaFactura(): number | null {
    const subtotal = this.subtotalFactura;
    if (subtotal === null || !this.tipoPersona) return null;
    return this.redondear(subtotal * this.tasaIva);
  }

  get isrFactura(): number | null {
    const subtotal = this.subtotalFactura;
    if (subtotal === null || this.tipoPersona !== 'moral') return null;
    return this.redondear(subtotal * this.tasaIsr);
  }

  get totalFactura(): number | null {
    const tickets = this.ticketsParaFacturar;
    if (tickets.length <= 1) return this.total;
    return this.totalCombinado;
  }

  get clienteFactura(): ClienteDatos | null {
    const lista = this.ticketsParaFacturar;
    const base = lista.length ? lista[0] : this.datosBase ?? this.store.obtener() ?? null;
    return base?.cliente ?? null;
  }

  get rfcFactura(): string {
    return this.clienteFactura?.rfc?.trim() || this.rfc.trim();
  }

  get razonSocialFactura(): string {
    return this.clienteFactura?.razonSocial?.trim() || this.razonSocial.trim();
  }

  get conceptosTickets(): { ticket: DatosFacturaResponse; concepto: string; importe: number | null }[] {
    return this.ticketsParaFacturar.map((t) => ({
      ticket: t,
      concepto: this.conceptoParaTicket(t),
      importe: t?.subtotal ?? null,
    }));
  }

  private conceptoParaTicket(t: DatosFacturaResponse): string {
    const items = t?.items ?? [];
    const conceptos = items
      .map((i) => {
        const descripcion = (i?.descripcion ?? '').trim();
        if (!descripcion) {
            return '';
        }
        const cantidad = i?.cantidad ? (i.cantidad + ' ') : '';
        const importe = i?.importe ?? i?.precioUnitario ?? null;
        const importeTexto = importe ? ' - ' + this.formatoMoneda(importe) : '';
        return ((cantidad) + descripcion + importeTexto).trim();
      })
      .filter((c) => !!c);
    return conceptos.length ? conceptos.join(' - ') : 'Venta de productos y/o servicios';
  }

  get usoOpciones(): { value: string; label: string }[] {
    if (!this.regimenFiscal) return [];
    const filtrados = filtrarUsosCfdi(this.regimenFiscal);
    const extras = this.usosExtra.filter((e) => !filtrados.some((f) => f.value === e.value));
    return [...filtrados, ...extras];
  }

  get regimenFiscalOpciones(): { value: string; label: string }[] {
    return filtrarRegimenesFiscales(this.regimen);
  }

  get usoFacturaTexto(): string {
    return usoCfdiLabel(this.uso);
  }

  get regimenFiscalTexto(): string {
    return regimenFiscalLabel(this.regimenFiscal);
  }

  get domicilioTexto(): string {
    const linea = [this.calle.trim(), this.numExterior.trim()].filter(Boolean).join(' ');
    const interior = this.numInterior.trim() ? `Int. ${this.numInterior.trim()}` : '';
    return [
      linea,
      interior,
      this.colonia.trim(),
      this.codigoPostal.trim(),
      this.municipio.trim(),
      this.estado.trim(),
    ].filter(Boolean).join(', ');
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: DatosFacturaStore,
    private facturacion: FacturacionService
  ) {}

  formatoMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  formatoImpuestos(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || valor === 0) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  ngOnInit(): void {
    this.desdeAdmin = this.route.snapshot.queryParamMap.get('admin') === '1';
    const state = history.state as { datos?: DatosFacturaResponse; rfcCapturado?: string } | undefined;
    const datos = this.store.obtener() ?? state?.datos ?? null;
    const rfcCapturado = this.store.obtenerRfcCapturado() || state?.rfcCapturado || '';
    if (datos) {
      this.datosBase = datos;
      this.store.guardar(datos, rfcCapturado);
      this.tickets = datos?.tickets && datos.tickets.length ? datos.tickets : [datos];
      this.subtotal = datos.subtotal ?? null;
      this.impuestos = datos.impuestos ?? null;
      this.total = datos.total ?? this.calcularTotal(this.subtotal, this.impuestos);
      this.tipoPago = datos.tipoPago ?? null;
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
      this.regimen = '';
      this.uso = normalizarUsoCfdi(c.usoFactura ?? '');
      this.regimenFiscal = normalizarRegimenFiscal(c.regimenFiscal ?? '');
      if (this.uso && !USOS_CFDI.some((o) => o.value === this.uso)) {
        this.usosExtra = [{ value: this.uso, label: this.uso }];
      }
    } else {
      this.rfc = rfcCapturado;
    }
    this.actualizarRegimen();
  }

  actualizarRegimen(): void {
    const rfc = (this.rfc || '').trim();
    if (rfc.length === 12) this.regimen = 'moral';
    else if (rfc.length === 13) this.regimen = 'fisica';
    else this.regimen = '';
    // Normalizar el régimen y descartarlo si no aplica al tipo de persona.
    if (this.regimenFiscal) {
      const normalizado = normalizarRegimenFiscal(this.regimenFiscal);
      this.regimenFiscal = normalizado;
      if (normalizado && this.regimen
        && !filtrarRegimenesFiscales(this.regimen).some((o) => o.value === normalizado)) {
        this.regimenFiscal = '';
      }
    }
    // El uso CFDI depende del régimen seleccionado; si no es válido, limpiarlo.
    if (this.uso) {
      const normalizado = normalizarUsoCfdi(this.uso);
      this.uso = normalizado;
      const permitidos = filtrarUsosCfdi(this.regimenFiscal);
      if (!this.regimenFiscal || !permitidos.some((o) => o.value === this.uso)) {
        this.uso = '';
      }
    }
  }

  private calcularTotal(subtotal: number | null, impuestos: number | null): number | null {
    if (subtotal === null || subtotal === undefined) return null;
    const s = subtotal;
    const i = impuestos ?? 0;
    return Math.round((s + i) * 100) / 100;
  }

  cancelar(): void {
    this.formDatos?.nativeElement.reset();
    void this.router.navigate(['/facturar'], { queryParams: this.desdeAdmin ? { admin: 1 } : {} });
  }

  volver(): void {
    void this.router.navigate(['/facturar'], { queryParams: this.desdeAdmin ? { admin: 1 } : {} });
  }

  buscarYAgregarTicket(): void {
    const rfc = this.rfc.trim();
    const numeroTicket = this.ticketParaAgregar.numeroTicket.trim();
    const fecha = this.ticketParaAgregar.fecha.trim();
    const total = Number(this.ticketParaAgregar.total);
    if (!rfc || (rfc.length !== 12 && rfc.length !== 13)) {
      this.mostrarError('Captura un RFC válido de 12 o 13 caracteres.');
      return;
    }
    if (!numeroTicket) {
      this.mostrarError('Captura el número de ticket.');
      return;
    }
    if (!fecha) {
      this.mostrarError('Captura la fecha del ticket.');
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      this.mostrarError('Captura un total válido mayor a cero.');
      return;
    }
    this.cargando = true;
    this.facturacion.obtenerDatosFactura(rfc, numeroTicket, fecha, total).subscribe({
      next: (datos) => {
        this.cargando = false;
        if (datos?.numeroTicket) {
          const rfcTicket = (datos?.cliente?.rfc ?? rfc).trim();
          const totalTicket = datos?.total ?? total;
          const factor = rfcTicket.length === 13 ? 1.16 : 1.1475;
          const subtotalCalc = Math.round((totalTicket / factor) * 100) / 100;
          datos.subtotal = subtotalCalc;
          datos.iva = Math.round(subtotalCalc * 0.16 * 100) / 100;
          datos.isr = rfcTicket.length === 12 ? Math.round(subtotalCalc * 0.0125 * 100) / 100 : 0;
          datos.total = totalTicket;
          this.tickets.push(datos);
        }
        this.ticketParaAgregar = { rfc: '', numeroTicket: '', fecha: '', total: '' };
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        this.mostrarError(this.mensajeError(e));
      },
    });
  }

  aceptar(): void {
    this.intento = true;
    const form = this.formDatos?.nativeElement;
    if (form && !form.reportValidity()) {
      return;
    }
    const rfc = (this.rfc || '').trim();
    if (rfc.length !== 12 && rfc.length !== 13) {
      this.mostrarError('El RFC debe ser de 12 (persona moral) o 13 (persona física) caracteres.');
      return;
    }
    this.actualizarRegimen();
    if (!normalizarRegimenFiscal(this.regimenFiscal)) {
      this.mostrarError('Seleccione el régimen fiscal.');
      return;
    }
    const state = history.state as { datos?: DatosFacturaResponse } | undefined;
    const base = this.datosBase ?? this.store.obtener() ?? state?.datos ?? null;
    if (!base?.numeroTicket) {
      this.mostrarError('No se encontró el ticket a facturar. Regrese y capture de nuevo.');
      return;
    }
    this.confirmacionAbierta = true;
    this.intento = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.closeConfirm?.nativeElement.focus());
  }

  cancelarConfirmacion(): void {
    this.confirmacionAbierta = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmacionAbierta) this.cancelarConfirmacion();
  }

  generar(): void {
    this.confirmacionAbierta = false;
    document.body.style.overflow = '';
    const state = history.state as { datos?: DatosFacturaResponse } | undefined;
    const base = this.datosBase ?? this.store.obtener() ?? state?.datos ?? null;
    if (!base?.numeroTicket) {
      this.mostrarError('No se encontró el ticket a facturar. Regrese y capture de nuevo.');
      return;
    }
    this.cargando = true;
    this.facturacion.facturar(this.construirPayload(this.ticketsParaFacturar)).subscribe({
      next: (facturada) => {
        this.cargando = false;
        this.store.guardar(facturada, this.rfc.trim());
        const correo = this.correo.trim();
        const mensajeExito = `Factura generada con éxito para el ticket ${facturada.numeroTicket ?? base.numeroTicket ?? ''}`.trim();
        void this.router.navigate(['/factura'], {
          state: { datos: facturada, correo, mensajeExito, origen: 'facturacion' },
          queryParams: this.desdeAdmin ? { admin: 1 } : {},
        });
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

  private construirPayload(tickets: DatosFacturaResponse[]): DatosFacturaResponse {
    const lista = tickets.length ? tickets : this.ticketsParaFacturar;
    const base = lista[0] ?? this.datosBase ?? this.store.obtener() ?? null;
    const subtotal = this.redondear(lista.reduce((acc, t) => acc + (t?.subtotal ?? 0), 0));
    const impuestos = this.redondear(lista.reduce((acc, t) => acc + (t?.impuestos ?? 0), 0));
    const iva = this.redondear(lista.reduce((acc, t) => acc + (t?.iva ?? 0), 0));
    const isr = this.redondear(lista.reduce((acc, t) => acc + (t?.isr ?? 0), 0));
    const total = this.redondear(lista.reduce((acc, t) => acc + (t?.total ?? 0), 0));
    return {
      numeroTicket: base?.numeroTicket,
      subtotal,
      impuestos,
      iva,
      isr,
      cedular: this.redondear(lista.reduce((acc, t) => acc + (t?.cedular ?? 0), 0)),
      total,
      tipoVenta: base?.tipoVenta,
      fechaEmision: base?.fechaEmision,
      fechaCierre: base?.fechaCierre,
      clienteTicket: base?.clienteTicket,
      facturable: base?.facturable ?? true,
      items: base?.items ?? lista.flatMap((t) => t?.items ?? []),
      pagos: base?.pagos ?? lista.flatMap((t) => t?.pagos ?? []),
      tipoPago: base?.tipoPago,
      cliente: {
        idCliente: base?.cliente?.idCliente ?? null,
        rfc: base?.cliente?.rfc?.trim() || this.rfc.trim(),
        razonSocial: base?.cliente?.razonSocial?.trim() || this.razonSocial.trim(),
        calle: this.calle.trim() || null,
        numExterior: this.numExterior.trim() || null,
        numInterior: this.numInterior.trim() || null,
        referencia: this.referencia.trim() || null,
        estado: this.estado.trim() || null,
        municipio: this.municipio.trim() || null,
        colonia: this.colonia.trim() || null,
        codigoPostal: this.codigoPostal.trim() || null,
        correoElectronico: this.correo.trim() || null,
        regimenFiscal: normalizarRegimenFiscal(this.regimenFiscal) || null,
        usoFactura: this.uso || null,
        estatus: base?.cliente?.estatus ?? true,
      },
      tickets: lista.map((t) => ({ ...t })),
    };
  }

  ivaDeTicket(t: DatosFacturaResponse): number | null {
    if (t?.iva !== null && t?.iva !== undefined) return t.iva ?? null;
    const total = Number(t?.total);
    if (!Number.isFinite(total) || total <= 0) return null;
    const rfcTicket = (t?.cliente?.rfc ?? this.rfc).trim();
    const factor = rfcTicket.length === 13 ? 1.16 : 1.1475;
    const subtotal = this.redondear(total / factor);
    return this.redondear(subtotal * this.tasaIva);
  }

  isrDeTicket(t: DatosFacturaResponse): number | null {
    if (t?.isr !== null && t?.isr !== undefined) return t.isr ?? null;
    const total = Number(t?.total);
    if (!Number.isFinite(total) || total <= 0) return null;
    const rfcTicket = (t?.cliente?.rfc ?? this.rfc).trim();
    if (rfcTicket.length !== 12) return 0;
    const subtotal = this.redondear(total / 1.1475);
    return this.redondear(subtotal * this.tasaIsr);
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
