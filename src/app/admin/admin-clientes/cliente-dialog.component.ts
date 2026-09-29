import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

import { ClienteItem } from '../clientes.service';

@Component({
    selector: 'app-cliente-dialog',
    imports: [],
    templateUrl: './cliente-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./cliente-dialog.component.css']
})
export class ClienteDialogComponent {
  @Input() cliente?: ClienteItem;
  @Output() cerrar = new EventEmitter<void>();

  formatearFecha(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = (n: number) => String(n).padStart(2, '0');
    const fecha = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const hora = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    return `${fecha} ${hora}`;
  }
}