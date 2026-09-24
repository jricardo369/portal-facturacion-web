import { Component, EventEmitter, Output } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-aviso-dialog',
    imports: [RouterLink],
    templateUrl: './aviso-dialog.component.html',
    styleUrls: ['./aviso-dialog.component.css']
})
export class AvisoDialogComponent {
  @Output() cerrar = new EventEmitter<void>();
}
