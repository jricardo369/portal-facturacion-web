import { Component } from '@angular/core';

import { AvisoDialogComponent } from '../../aviso-privacidad/aviso-dialog.component';

@Component({
    selector: 'app-footer',
    imports: [AvisoDialogComponent],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  avisoAbierto = false;
}
