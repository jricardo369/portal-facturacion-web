import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { FooterComponent } from '../layout/footer/footer.component';

@Component({
    selector: 'app-aviso-privacidad',
    imports: [FooterComponent],
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
