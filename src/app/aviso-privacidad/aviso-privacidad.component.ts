import { Component } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';

@Component({
  selector: 'app-aviso-privacidad',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './aviso-privacidad.component.html',
  styleUrls: ['./aviso-privacidad.component.css'],
})
export class AvisoPrivacidadComponent {
  constructor(private location: Location) {}

  volver(): void {
    this.location.back();
  }
}
