import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { DatosFacturaPayload, DatosFacturaResponse, FacturacionService } from '../facturacion/facturacion.service';
import { filtrarUsosCfdi, normalizarUsoCfdi, usoCfdiLabel } from '../facturacion/uso-cfdi.catalog';
import { normalizarRegimenFiscal, regimenFiscalLabel } from '../facturacion/regimen-fiscal.catalog';

interface DatosNuevaFactura {
  cliente: string;
  rfc: string;
  correo: string;
  regimen: string;
  regimenFiscal: string;
  uso: string;
}

@Component({
    selector: 'app-refacturar',
    imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, LoadingOverlayComponent],
    templateUrl: './refacturar.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./refacturar.component.css']
})
export class RefacturarComponent {
  paso = 1;
  busqueda = '';
  error = '';
  cargando = false;
  encontrada?: DatosFacturaResponse;
  nueva?: DatosFacturaResponse;
  datos: DatosNuevaFactura = { cliente: '', rfc: '', correo: '', regimen: '', regimenFiscal: '', uso: '' };
  confirmacionAbierta = false;
  resumenDatos: { label: string; valor: string }[] = [];

  get usoOpciones(): { value: string; label: string }[] {
    return filtrarUsosCfdi(this.datos.regimenFiscal);
  }

  constructor(private facturacion: FacturacionService, private router: Router) {}

  buscar(): void {
    const filtro = this.busqueda.trim();
    if (!filtro) {
      this.error = 'Capture No. ticket o UUID para localizar la factura.';
      return;
    }
    this.error = '';
    this.cargando = true;
    this.facturacion.buscarFactura(filtro).subscribe({
      next: (f) => {
        this.cargando = false;
        this.encontrada = f;
        this.datos = {
          ...this.datos,
          cliente: f.cliente?.razonSocial ?? f.cliente?.correoElectronico ?? f.cliente?.rfc ?? f.clienteTicket ?? '',
          rfc: f.cliente?.rfc ?? '',
          correo: f.cliente?.correoElectronico ?? '',
          regimen: '',
          regimenFiscal: normalizarRegimenFiscal(f.cliente?.regimenFiscal ?? ''),
          uso: normalizarUsoCfdi(f.cliente?.usoFactura ?? ''),
        };
        this.actualizarRegimen();
        this.paso = 2;
        this.irAlInicio();
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        this.error = this.mensajeError(e);
      },
    });
  }

  generar(): void {
    if (!this.encontrada) return;
    const rfc = (this.datos.rfc || '').trim();
    if (!this.datos.cliente.trim() || !rfc || !this.datos.correo.trim() || !this.datos.uso) {
      this.error = 'Capture los campos obligatorios de la nueva factura.';
      return;
    }
    if (rfc.length !== 12 && rfc.length !== 13) {
      this.error = 'El RFC debe ser de 12 (persona moral) o 13 (persona física) caracteres.';
      return;
    }
    this.actualizarRegimen();
    this.error = '';
    this.construirResumen();
    this.confirmacionAbierta = true;
  }

  cancelarConfirmacion(): void {
    this.confirmacionAbierta = false;
  }

  generarFinal(): void {
    this.confirmacionAbierta = false;
    if (!this.encontrada) return;
    this.cargando = true;
    this.facturacion.refacturar(this.construirPayload(this.encontrada)).subscribe({
      next: (nueva) => {
        this.cargando = false;
        this.nueva = nueva;
        this.paso = 3;
        this.irAlInicio();
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        this.error = this.mensajeError(e);
      },
    });
  }

  reiniciar(): void {
    this.paso = 1;
    this.busqueda = '';
    this.encontrada = undefined;
    this.nueva = undefined;
    this.error = '';
    this.irAlInicio();
  }

  volver(): void {
    this.paso = 1;
    this.error = '';
    this.irAlInicio();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmacionAbierta) this.cancelarConfirmacion();
  }

  private irAlInicio(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  salir(): void {
    void this.router.navigate(['/admin']);
  }

  actualizarRegimen(): void {
    const rfc = (this.datos.rfc || '').trim();
    if (rfc.length === 12) this.datos.regimen = 'moral';
    else if (rfc.length === 13) this.datos.regimen = 'fisica';
    else this.datos.regimen = '';
    // El uso CFDI depende del régimen heredado de la factura original.
    if (this.datos.uso) {
      const normalizado = normalizarUsoCfdi(this.datos.uso);
      this.datos.uso = normalizado;
      const permitidos = filtrarUsosCfdi(this.datos.regimenFiscal);
      if (!this.datos.regimenFiscal || !permitidos.some((o) => o.value === this.datos.uso)) {
        this.datos.uso = '';
      }
    }
  }

  private usoFacturaLabel(): string {
    return usoCfdiLabel(this.datos.uso);
  }

  private regimenResumen(): string {
    return regimenFiscalLabel(this.datos.regimenFiscal);
  }

  private construirResumen(): void {
    this.resumenDatos = [
      { label: 'Ticket anterior', valor: this.encontrada?.numeroTicket ?? '' },
      { label: 'RFC', valor: this.datos.rfc.trim() },
      { label: 'Razón social', valor: this.datos.cliente.trim() },
      { label: 'Correo electrónico', valor: this.datos.correo.trim() },
      { label: 'Uso CFDI', valor: this.usoFacturaLabel() },
      { label: 'Régimen', valor: this.regimenResumen() },
      { label: 'Subtotal', valor: this.encontrada?.subtotal != null ? this.moneda(this.encontrada.subtotal) : '' },
      { label: 'Impuestos', valor: this.encontrada?.impuestos != null ? this.moneda(this.encontrada.impuestos) : '' },
      { label: 'Total', valor: this.moneda(this.resumenTotal) },
    ];
  }

  private moneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  get resumenSubtotal(): number {
    return this.encontrada?.subtotal ?? 0;
  }

  get resumenImpuestos(): number {
    return this.encontrada?.impuestos ?? 0;
  }

  get resumenTotal(): number {
    return this.redondear(this.resumenSubtotal + this.resumenImpuestos);
  }

  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private construirPayload(base: DatosFacturaResponse): DatosFacturaPayload {
    return {
      ...base,
      total: this.resumenTotal,
      subtotal: this.resumenSubtotal,
      impuestos: this.resumenImpuestos,
      cliente: {
        idCliente: base.cliente?.idCliente ?? null,
        rfc: this.datos.rfc.trim(),
        razonSocial: this.datos.cliente.trim(),
        calle: base.cliente?.calle ?? null,
        numExterior: base.cliente?.numExterior ?? null,
        numInterior: base.cliente?.numInterior ?? null,
        referencia: base.cliente?.referencia ?? null,
        estado: base.cliente?.estado ?? null,
        municipio: base.cliente?.municipio ?? null,
        colonia: base.cliente?.colonia ?? null,
        codigoPostal: base.cliente?.codigoPostal ?? null,
        correoElectronico: this.datos.correo.trim(),
        regimenFiscal: normalizarRegimenFiscal(this.datos.regimenFiscal) || null,
        usoFactura: this.datos.uso || null,
        estatus: base.cliente?.estatus ?? true,
      },
    };
  }

  private mensajeError(e: HttpErrorResponse): string {
    const detail = (e?.error as { detail?: string; message?: string })?.detail
      ?? (e?.error as { message?: string })?.message;
    if (detail) return detail;
    if (e.status === 0) return 'No se pudo conectar con el servidor. Verifique su conexión.';
    if (e.status === 400) return 'Verifique los datos capturados.';
    if (e.status === 401) return 'No autorizado. Inicie sesión para continuar.';
    if (e.status === 403) return 'No tiene permisos para realizar esta operación.';
    if (e.status === 404) return 'No se encontró información para el ticket o UUID capturado.';
    return 'No se pudo completar la solicitud. Intente de nuevo.';
  }
}