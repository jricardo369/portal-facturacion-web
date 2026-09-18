import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aviso-dialog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './aviso-dialog.component.html',
  styleUrls: ['./aviso-dialog.component.css'],
})
export class AvisoDialogComponent {
  @Output() cerrar = new EventEmitter<void>();
}
