import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvisoDialogComponent } from '../../aviso-privacidad/aviso-dialog.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, AvisoDialogComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent {
  avisoAbierto = false;
}
