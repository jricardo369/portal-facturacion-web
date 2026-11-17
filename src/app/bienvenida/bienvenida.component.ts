import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../layout/footer/footer.component';
import { ContactoDialogComponent } from '../contacto/contacto-dialog.component';

@Component({
    selector: 'app-bienvenida',
    imports: [RouterLink, FooterComponent, ContactoDialogComponent],
    templateUrl: './bienvenida.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./bienvenida.component.css']
})
export class BienvenidaComponent {
  contactoAbierto = false;
}
