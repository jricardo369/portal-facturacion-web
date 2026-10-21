import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import { FacturaItem, FacturasService } from '../facturas.service';

type TipoComprobante = 'xml' | 'pdf';

@Component({
    selector: 'app-factura-dialog',
    imports: [],
    templateUrl: './factura-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./factura-dialog.component.css']
})
export class FacturaDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() factura?: FacturaItem;
  @Output() cerrar = new EventEmitter<void>();
  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;
  private previousOverflow = '';

  private readonly facturas = inject(FacturasService);

  descargando = false;
  tipoDescarga: TipoComprobante | null = null;
  errorDescarga = '';

  ngOnInit(): void {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    this.closeBtn?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.previousOverflow;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrar.emit();
  }

  estado(f: FacturaItem | undefined): string {
    if (!f) return '—';
    const e = (f.estatus ?? '').trim().toLowerCase();
    if (!e) return '—';
    return e.charAt(0).toUpperCase() + e.slice(1);
  }

  esCancelada(f: FacturaItem | undefined): boolean {
    return (f?.estatus ?? '').toLowerCase() === 'cancelada';
  }

  esCargada(f: FacturaItem | undefined): boolean {
    return (f?.estatus ?? '').toLowerCase() === 'cargada';
  }

  cliente(f: FacturaItem | undefined): string {
    return f?.cliente ?? f?.razonSocial ?? '—';
  }

  formatearFecha(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = (n: number) => String(n).padStart(2, '0');
    const fecha = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const hora = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    return `${fecha} ${hora}`;
  }

  importe(n?: number | null): string {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  tieneComprobante(): boolean {
    return !!(this.factura?.uuid ?? '').trim();
  }

  descargar(tipo: TipoComprobante): void {
    if (this.descargando) return;

    const uuid = (this.factura?.uuid ?? '').trim();
    if (!uuid) {
      this.errorDescarga = 'Esta factura no tiene comprobante timbrado para descargar.';
      return;
    }

    this.errorDescarga = '';
    this.descargando = true;
    this.tipoDescarga = tipo;

    const peticion = tipo === 'pdf'
      ? this.facturas.descargarPdf(uuid)
      : this.facturas.descargarXml(uuid);

    peticion.subscribe({
      next: (blob) => {
        this.descargando = false;
        this.tipoDescarga = null;
        this.guardarArchivo(blob, tipo);
      },
      error: (e: HttpErrorResponse) => {
        this.descargando = false;
        this.tipoDescarga = null;
        this.errorDescarga = this.mensajeError(e);
      },
    });
  }

  private guardarArchivo(blob: Blob, tipo: TipoComprobante): void {
    const nombre = (this.factura?.folio || this.factura?.noTicket || this.factura?.uuid || 'comprobante')
      .toString()
      .trim()
      .replace(/[^\w.-]+/g, '-');
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cfdi-${nombre}.${tipo}`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  private mensajeError(e: HttpErrorResponse): string {
    const body = e?.error as { detail?: string; message?: string } | null;
    const detail = body?.detail ?? body?.message;
    if (detail) return detail;
    if (e.status === 0) return 'No se pudo conectar con el servidor. Verifique su conexión.';
    if (e.status === 401) return 'Sesión expirada. Vuelva a iniciar sesión.';
    if (e.status === 403) return 'No tiene permisos para descargar este comprobante.';
    if (e.status === 404) return 'No se encontró el comprobante de esta factura.';
    return 'No se pudo completar la descarga. Intente de nuevo.';
  }
}
