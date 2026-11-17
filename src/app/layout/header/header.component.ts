import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-header',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(private router: Router) {}

  get showMenu(): boolean {
    const sinHash = this.router.url.split('#')[0];
    const [url, query = ''] = sinHash.split('?');
    if (url === '/admin' || url === '/admin/') return false;
    if (url.includes('admin') || url.includes('refacturar')) return true;
    const rutasProceso = ['/facturar', '/datos-factura', '/factura'];
    return rutasProceso.includes(url) && new URLSearchParams(query).get('admin') === '1';
  }
}
