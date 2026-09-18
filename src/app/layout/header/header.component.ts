import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  constructor(private router: Router) {}

  get showMenu(): boolean {
    const url = this.router.url.split('?')[0].split('#')[0];
    if (url === '/admin' || url === '/admin/') return false;
    return url.includes('admin') || url.includes('refacturar');
  }
}
