import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ContactoService } from './contacto.service';

type MotivoContacto = 'DUDA' | 'ACLARACION';

@Component({
    selector: 'app-contacto-dialog',
    imports: [FormsModule],
    templateUrl: './contacto-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./contacto-dialog.component.css']
})
export class ContactoDialogComponent implements AfterViewInit, OnDestroy {
  readonly cerrar = output<void>();

  private readonly contacto = inject(ContactoService);

  readonly motivo = signal<MotivoContacto>('DUDA');
  readonly nombre = signal('');
  readonly fecha = signal('');
  readonly hora = signal('');
  readonly total = signal('');
  readonly descripcion = signal('');

  readonly intento = signal(false);
  readonly enviando = signal(false);
  readonly mensajeExito = signal('');
  readonly errorEnvio = signal('');

  @ViewChild('primerCampo') private primerCampo?: ElementRef<HTMLElement>;
  @ViewChild('dialogo') private dialogo?: ElementRef<HTMLElement>;

  private previousOverflow = '';

  esAclaracion(): boolean {
    return this.motivo() === 'ACLARACION';
  }

  cambiarMotivo(valor: string): void {
    this.motivo.set(valor === 'ACLARACION' ? 'ACLARACION' : 'DUDA');
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.enviando()) this.cerrar.emit();
  }

  ngAfterViewInit(): void {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.primerCampo?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.previousOverflow;
  }

  nombreInvalido(): boolean {
    return (this.nombre() ?? '').trim().length < 3;
  }

  descripcionInvalida(): boolean {
    return (this.descripcion() ?? '').trim().length < 10;
  }

  totalInvalido(): boolean {
    return !(parseFloat(this.total()) > 0);
  }

  aclaracionInvalida(): boolean {
    return !this.fecha() || !this.hora() || this.totalInvalido();
  }

  formularioInvalido(): boolean {
    if (this.nombreInvalido() || this.descripcionInvalida()) return true;
    if (this.esAclaracion() && this.aclaracionInvalida()) return true;
    return false;
  }

  enviar(): void {
    this.intento.set(true);
    this.errorEnvio.set('');
    this.mensajeExito.set('');

    if (this.formularioInvalido()) return;

    const motivo = this.motivo();
    const peticion: {
      nombre: string;
      motivo: MotivoContacto;
      descripcion: string;
      fecha?: string;
      hora?: string;
      total?: string;
    } = {
      nombre: this.nombre().trim(),
      motivo,
      descripcion: this.descripcion().trim(),
    };
    if (motivo === 'ACLARACION') {
      peticion.fecha = this.fecha();
      peticion.hora = this.hora();
      peticion.total = parseFloat(this.total()).toFixed(2);
    }

    this.enviando.set(true);
    this.contacto.enviarContacto(peticion).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.mensajeExito.set(respuesta?.mensaje ?? 'Solicitud registrada correctamente');
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorEnvio.set(this.mensajeError(e));
      },
    });
  }

  private mensajeError(e: HttpErrorResponse): string {
    const detail = (e?.error as { detail?: string; message?: string })?.detail
      ?? (e?.error as { message?: string })?.message;
    if (detail) return detail;
    if (e.status === 0) return 'No se pudo conectar con el servidor. Verifique su conexión.';
    return 'No se pudo registrar la solicitud. Intente de nuevo.';
  }
}
