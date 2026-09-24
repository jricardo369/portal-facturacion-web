import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturaItem } from '../facturas.service';

@Component({
    selector: 'app-factura-dialog',
    imports: [CommonModule],
    templateUrl: './factura-dialog.component.html',
    styleUrls: ['./factura-dialog.component.css']
})
export class FacturaDialogComponent {
  @Input() factura?: FacturaItem;
  @Output() cerrar = new EventEmitter<void>();

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
}