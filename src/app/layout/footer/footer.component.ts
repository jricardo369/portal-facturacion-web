import { Component, ChangeDetectionStrategy } from '@angular/core';

import { AvisoDialogComponent } from '../../aviso-privacidad/aviso-dialog.component';

@Component({
    selector: 'app-footer',
    imports: [AvisoDialogComponent],
    templateUrl: './footer.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  avisoAbierto = false;
}
