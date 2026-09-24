import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { SesionInactivaService } from './admin/sesion-inactiva.service';
import { SesionExpiradaComponent } from './admin/sesion-expirada.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SesionExpiradaComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'portal-facturacion-web';

  constructor(private sesionInactiva: SesionInactivaService) {}

  ngOnInit(): void {
    this.sesionInactiva.iniciar();
  }
}