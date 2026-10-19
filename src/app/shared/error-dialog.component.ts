import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-error-dialog',
    imports: [],
    template: `
    <div class="ui-backdrop" (click)="cerrar.emit()">
      <div class="ui-dialog error-dialog" role="alertdialog" aria-modal="true" aria-labelledby="titulo-error" (click)="$event.stopPropagation()">
        <div class="ui-dialog-head">
          <div>
            <h2 id="titulo-error">{{ titulo }}</h2>
            <p class="error-sub">Revisa la información e intenta de nuevo.</p>
          </div>
          <button type="button" class="ui-close" (click)="cerrar.emit()" aria-label="Cerrar error">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="ui-dialog-body">
          <div class="error-mensaje">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 7.5v5.5M12 16.5h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>{{ mensaje }}</p>
          </div>
        </div>
        <div class="ui-dialog-foot">
          <button type="button" class="ui-btn ui-btn--primary" (click)="cerrar.emit()">Entendido</button>
        </div>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    :host { display: contents; }
    .error-dialog { width: min(480px, 100%); }
    .error-dialog h2 { color: #B3261E; }
    .error-sub { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); }
    .error-mensaje { display: flex; gap: 12px; align-items: flex-start; }
    .error-mensaje svg { width: 22px; height: 22px; flex: 0 0 22px; margin-top: 2px; color: #B3261E; }
    .error-mensaje p { margin: 0; white-space: pre-line; font-size: 14px; line-height: 1.6; }
  `]
})
export class ErrorDialogComponent {
  @Input() titulo = 'No se pudo continuar';
  @Input() mensaje = 'Ocurrió un error inesperado.';
  @Output() cerrar = new EventEmitter<void>();
}
