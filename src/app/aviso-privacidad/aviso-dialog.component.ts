import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-aviso-dialog',
    imports: [RouterLink],
    templateUrl: './aviso-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./aviso-dialog.component.css']
})
export class AvisoDialogComponent {
  @Output() cerrar = new EventEmitter<void>();
}
