import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';

@Component({
    selector: 'app-aviso-privacidad',
    imports: [HeaderComponent, FooterComponent],
    templateUrl: './aviso-privacidad.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./aviso-privacidad.component.css']
})
export class AvisoPrivacidadComponent {
  constructor(private location: Location) {}

  volver(): void {
    this.location.back();
  }
}
