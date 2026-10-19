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
} from '@angular/core';

import { ClienteItem } from '../clientes.service';

@Component({
    selector: 'app-cliente-dialog',
    imports: [],
    templateUrl: './cliente-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./cliente-dialog.component.css']
})
export class ClienteDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cliente?: ClienteItem;
  @Output() cerrar = new EventEmitter<void>();
  @ViewChild('closeBtn') private closeBtn?: ElementRef<HTMLButtonElement>;
  private previousOverflow = '';

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
