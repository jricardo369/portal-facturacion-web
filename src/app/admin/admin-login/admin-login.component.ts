import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../auth.service';
import { LoadingOverlayComponent } from '../../shared/loading-overlay.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent {
  usuario = '';
  password = '';
  error = '';
  mostrar = false;
  cargando = false;

  constructor(private auth: AdminAuthService, private router: Router) {
    if (this.auth.isLoggedIn()) void this.router.navigate(['/admin/facturas']);
  }

  entrar(): void {
    this.error = '';
    if (!this.usuario.trim() || !this.password) {
      this.error = 'Capture usuario y contraseña.';
      return;
    }
    this.cargando = true;
    this.auth.login(this.usuario, this.password).subscribe({
      next: () => {
        this.cargando = false;
        void this.router.navigate(['/admin/facturas']);
      },
      error: (e) => {
        this.cargando = false;
        this.error = e?.status === 401 ? 'Usuario o contraseña incorrectos.' : 'No se pudo iniciar sesión. Intente de nuevo.';
      },
    });
  }
}
