import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-backdrop" (click)="cerrar.emit()">
      <div class="error-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="titulo-error" (click)="$event.stopPropagation()">
        <div class="error-head">
          <h2 id="titulo-error">{{ titulo }}</h2>
          <button type="button" class="error-cerrar" (click)="cerrar.emit()" aria-label="Cerrar error">✕</button>
        </div>
        <div class="error-cuerpo">
          <p>{{ mensaje }}</p>
        </div>
        <div class="error-pie">
          <button type="button" class="btn-entendido" (click)="cerrar.emit()">Entendido</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-backdrop { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,.5); display: grid; place-items: center; padding: 20px; }
    .error-dialogo { width: min(480px, 100%); background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
    .error-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #eee; }
    .error-head h2 { margin: 0; font-family: "Comfortaa", "Nunito", sans-serif; font-size: 19px; color: #b3261e; }
    .error-cerrar { border: 0; background: transparent; cursor: pointer; font-size: 18px; color: #6e6e6e; padding: 6px 10px; border-radius: 6px; }
    .error-cerrar:hover { background: #f0f0f0; color: #333; }
    .error-cuerpo { padding: 16px 20px; font-size: 14px; line-height: 1.6; color: #3c3c3c; }
    .error-cuerpo p { margin: 0; white-space: pre-line; }
    .error-pie { display: flex; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid #eee; }
    .btn-entendido { border: 0; cursor: pointer; font: inherit; font-size: 14px; padding: 8px 28px; border-radius: 4px; color: #fff; background: #b3261e; }
    .btn-entendido:hover { background: #8f1d17; }
  `],
})
export class ErrorDialogComponent {
  @Input() titulo = 'No se pudo continuar';
  @Input() mensaje = 'Ocurrió un error inesperado.';
  @Output() cerrar = new EventEmitter<void>();
}
