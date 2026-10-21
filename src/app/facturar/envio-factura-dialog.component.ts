import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { FacturacionService } from '../facturacion/facturacion.service';

type TipoComprobante = 'xml' | 'pdf';

@Component({
    selector: 'app-envio-factura-dialog',
    imports: [FormsModule],
    templateUrl: './envio-factura-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./envio-factura-dialog.component.css']
})
export class EnvioFacturaDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly numeroTicket = input<string>('');
  readonly correoInicial = input<string>('');
  readonly cerrar = output<void>();
  readonly reenviado = output<string>();

  private readonly facturacion = inject(FacturacionService);

  readonly correoEnvio = signal('');
  readonly correoEnviado = signal('');
  readonly intento = signal(false);
  readonly enviando = signal(false);
  readonly descargando = signal(false);
  readonly tipoDescarga = signal<TipoComprobante | null>(null);
  readonly errorReenvio = signal('');
  readonly errorDescarga = signal('');
  readonly mensajeReenvio = signal('');

  @ViewChild('cerrarBtn') private cerrarBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('dialogo') private dialogo?: ElementRef<HTMLElement>;

  private uuid = '';
  private previousOverflow = '';

  ngOnInit(): void {
    const correo = (this.correoInicial() ?? '').trim();
    this.correoEnviado.set(correo);
    this.correoEnvio.set(correo);
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    this.cerrarBtn?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.previousOverflow;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrar.emit();
  }

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const root = this.dialogo?.nativeElement;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusables.length === 0) return;
    const primero = focusables[0];
    const ultimo = focusables[focusables.length - 1];
    const activo = document.activeElement;
    if (event.shiftKey && (activo === primero || !root.contains(activo))) {
      event.preventDefault();
      ultimo.focus();
      return;
    }
    if (!event.shiftKey && activo === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }

  correoInvalido(): boolean {
    return !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((this.correoEnvio() ?? '').trim());
  }

  reenviar(): void {
    this.intento.set(true);
    this.errorReenvio.set('');
    this.mensajeReenvio.set('');

    const correo = (this.correoEnvio() ?? '').trim();
    if (!correo || this.correoInvalido()) {
      this.errorReenvio.set('Captura un correo electrónico válido para reenviar la factura.');
      return;
    }
    const ticket = (this.numeroTicket() ?? '').trim();
    if (!ticket) {
      this.errorReenvio.set('No se identificó el ticket de la factura, no se puede reenviar el correo.');
      return;
    }

    this.enviando.set(true);
    this.facturacion.reenviarFactura(correo, ticket).subscribe({
      next: () => {
        this.enviando.set(false);
        this.correoEnviado.set(correo);
        this.mensajeReenvio.set(`Factura reenviada a ${correo}.`);
        this.reenviado.emit(correo);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorReenvio.set(this.mensajeError(e));
      },
    });
  }

  descargar(tipo: TipoComprobante): void {
    if (this.descargando()) return;
    this.errorDescarga.set('');

    const ticket = (this.numeroTicket() ?? '').trim();
    if (!ticket) {
      this.errorDescarga.set('No se identificó el ticket de la factura, no se puede descargar el comprobante.');
      return;
    }

    this.descargando.set(true);
    this.tipoDescarga.set(tipo);

    if (this.uuid) {
      this.solicitarDescarga(this.uuid, tipo);
      return;
    }

    this.facturacion.obtenerFacturaPorTicket(ticket).subscribe({
      next: (factura) => {
        const uuid = factura?.uuid?.trim() ?? '';
        if (!uuid) {
          this.descargando.set(false);
          this.tipoDescarga.set(null);
          this.errorDescarga.set('Esta factura no tiene comprobante timbrado para descargar.');
          return;
        }
        this.uuid = uuid;
        this.solicitarDescarga(uuid, tipo);
      },
      error: (e: HttpErrorResponse) => {
        this.descargando.set(false);
        this.tipoDescarga.set(null);
        this.errorDescarga.set(this.mensajeError(e));
      },
    });
  }

  private solicitarDescarga(uuid: string, tipo: TipoComprobante): void {
    const peticion = tipo === 'pdf'
      ? this.facturacion.descargarPdf(uuid)
      : this.facturacion.descargarXml(uuid);
    peticion.subscribe({
      next: (blob) => {
        this.descargando.set(false);
        this.tipoDescarga.set(null);
        this.guardarArchivo(blob, tipo);
      },
      error: (e: HttpErrorResponse) => {
        this.descargando.set(false);
        this.tipoDescarga.set(null);
        this.errorDescarga.set(this.mensajeError(e));
      },
    });
  }

  private guardarArchivo(blob: Blob, tipo: TipoComprobante): void {
    const ticket = (this.numeroTicket() ?? '').trim();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cfdi-${ticket || this.uuid}.${tipo}`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  private mensajeError(e: HttpErrorResponse): string {
    const detail = (e?.error as { detail?: string; message?: string })?.detail
      ?? (e?.error as { message?: string })?.message;
    if (detail) return detail;
    if (e.status === 0) return 'No se pudo conectar con el servidor. Verifique su conexión.';
    if (e.status === 401) return 'No autorizado. Inicie sesión para continuar.';
    if (e.status === 403) return 'No tiene permisos para consultar esta información.';
    if (e.status === 404) return 'No se encontró la factura solicitada.';
    return 'No se pudo completar la solicitud. Intente de nuevo.';
  }
}
